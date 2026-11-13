# Education Atlas: Full-Stack Web GIS Platform for Spatial Analysis

A full-stack web GIS application I designed and built on my own. It maps education facilities, administrative districts and population across Pakistan, runs spatial analysis on the spot when a user clicks the map, and includes a statistics dashboard and an AI object-detection tool.

![Platform overview](docs/screenshots/01_platform_overview.png)

## Highlights

- **Instant buffer analysis:** Click any school to see how many people live within 5 km of it, calculated live in PostGIS.
- **Live map services:** Every layer is an OGC WMS service published from my own GeoServer instance, styled with custom SLD.
- **District dashboard:** Facility counts and an age-and-sex population pyramid for any district or the whole country.
- **GeoAI object detection:** Upload an image and a YOLOv8 model I fine-tuned on my own dataset detects objects and draws interactive bounding boxes.
- **Real-world data:** Facilities from OpenStreetMap, district boundaries from Who's On First, and population from WorldPop rasters processed with my own pipeline ([Download-and-Merge-Tif-file](https://github.com/ryy531/Download-and-Merge-Tif-file)).

## How the buffer analysis works

1. The React + Leaflet front end captures the click and sends the coordinates and radius to a FastAPI endpoint.
2. FastAPI runs a PostGIS `ST_DWithin` query that sums every population point inside the buffer.
3. The API returns the total population and population density as JSON.
4. The front end draws the buffer in red (high density) or green (low density) and shows the figures in a popup.

![5 km buffer analysis result](docs/screenshots/08_buffer_result_population.png)

## More features

- **Custom cartography:** SLD styles control symbology and zoom-dependent rendering. Population points only appear once the map is zoomed in far enough, which keeps the map fast.
- **Feature info popups:** Click a population point, a district or a facility to see its attributes (WMS GetFeatureInfo).
- **District filter:** Choose a district from the dropdown and the map zooms to its bounding box, computed with PostGIS `ST_Extent`.
- **Dashboard:** Facility count for the selected district compared with the national total, plus a population pyramid built with Chart.js from 18 age groups by sex.
- **GeoAI analyzer:** A collapsible sidebar for image upload and preview, a clickable list of detections with confidence scores, and a canvas that highlights the matching bounding box.
- **Automated tests:** API tests with pytest and httpx.

| Layer control | Facility info | District filter |
|---|---|---|
| ![](docs/screenshots/02_wms_layer_control.png) | ![](docs/screenshots/04_facility_info_popup.png) | ![](docs/screenshots/09_province_filter_zoom.png) |

## Architecture

```
React + Leaflet + Chart.js (Vite)
   │                      │
   │ WMS                  │ REST / JSON
   ▼                      ▼
GeoServer (SLD)       FastAPI + SQLAlchemy ──▶ YOLOv8 (Ultralytics)
   │                      │
   └──────────▶ PostgreSQL + PostGIS ◀──────────┘
```

## Tech stack

| Layer | Tools |
|---|---|
| Front end | React, Leaflet, react-leaflet, Chart.js, Vite |
| Map services | GeoServer (WMS, GetFeatureInfo, SLD) |
| Back end | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL + PostGIS |
| AI | Ultralytics YOLOv8, PyTorch |
| Testing | pytest, httpx |

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/population_in_buffer` | Total population and density within a radius of a point |
| POST | `/api/find_nearby_facilities` | Facilities near a point |
| GET | `/api/provinces` | List of districts for the filter |
| GET | `/api/province_bounds/{name}` | Bounding box for map zoom |
| GET | `/api/facility_stats/{name}` | Facility count for a district and nationwide |
| GET | `/api/population_pyramid/{name}` | Population by age group and sex (`Nationwide` for the whole country) |
| POST | `/api/ai/detect_objects` | Run object detection on an uploaded image |

Interactive API docs are available at `http://127.0.0.1:8000/docs` when the back end is running.

## Running locally

Requirements: Python 3.10+, Node.js 18+, PostgreSQL with PostGIS, GeoServer on port 8080.

```bash
# Back end (from the repository root)
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r backend/requirements.txt
```

Create a `.env` file in the repository root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
```

```bash
python -m uvicorn backend.Scripts.MainApi:app --reload
pytest                          # run the API tests

# Front end
cd frontend
npm install
npm run dev
```

Publish the PostGIS tables as layers in a GeoServer workspace and apply the styles in `backend/geoserver_styles/`.

To retrain the detection model, put a YOLO-format dataset in `AIDataSet/` and run `python backend/Scripts/train_model.py`.

## Status

Core map, analysis, dashboard and GeoAI features are working. An online deployment is in progress.
