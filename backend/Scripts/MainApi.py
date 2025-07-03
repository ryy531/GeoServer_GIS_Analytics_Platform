# -------------------------------------------------------------------
# MainApi.py for the GeoServer Project
# -------------------------------------------------------------------

# Import necessary libraries
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import geopandas as gpd
from sqlalchemy import create_engine, text
import json

# We will add database-related imports later (SQLAlchemy, GeoPandas)
# command activate venv environment :  .\venv\Scripts\activate

# Initialize FastAPI app
# Server start command: python -m uvicorn Scripts.MainApi:app --reload
app = FastAPI()
DATABASE_CONNECTION_STRING = (
    "postgresql://postgres:960531wdxxm@localhost:5432/geoserver_practice"
)
engine = create_engine(DATABASE_CONNECTION_STRING)
education_table_name = "education_facilities_points"
polygon_table_name = "admin_county_polygon"
test_population_name = "v_population_chitral"
# --- CORS (Cross-Origin Resource Sharing) Middleware Configuration ---
# This allows our Leaflet HTML file to make requests to this backend
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:5500",  # Common port for VS Code Live Server
    "http://localhost:5173",
    "null",  # Allows requests from local HTML files (file://)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# --- Pydantic Models ---
class NearbySearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float


class BufferRequest(BaseModel):
    latitude: float
    longitude: float
    radius_m: float


# --- API Endpoints ---
@app.get("/")
def read_root():
    """A simple root endpoint to confirm the API is running."""
    return {"message": "Welcome to the Geo-Education-Atlas API!"}


@app.post("/api/find_nearby_facilities")
async def find_nearby_facilities(request: NearbySearchRequest):
    SQL_QUERY_EDUCATION_POINTS = f"""SELECT name,amenity,geom FROM public.{education_table_name} WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius_in_meters);"""
    insert_params = {
        "lon": request.longitude,
        "lat": request.latitude,
        "radius_in_meters": request.radius_km * 1000,
    }
    try:
        gdf = gpd.read_postgis(
            sql=text(SQL_QUERY_EDUCATION_POINTS),
            con=engine,
            params=insert_params,
            geom_col="geom",
        )
        if gdf.empty:
            return {"message": "No facilities found in the specified area."}
        else:
            return gdf.__geo_interface__
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.post("/api/population_in_buffer")
async def get_population_in_buffer(request: BufferRequest):
    SQL_QUERY_POPULATION_POINTS = text(
        """
        SELECT SUM("TotalPopulation")
        FROM pak_unadj_constrained
        WHERE ST_DWithin(
            geometry::geography,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            :radius_m
        );
    """
    )
    conn = engine.connect()
    total_population = None
    try:
        result = conn.execute(
            SQL_QUERY_POPULATION_POINTS,
            {
                "lat": request.latitude,
                "lon": request.longitude,
                "radius_m": request.radius_m,
            },
        )

        total_population = result.scalar_one_or_none()
    finally:
        conn.close()

    calculated_population = int(total_population) if total_population is not None else 0
    print(
        f"in radius {request.radius_m} meter, the population calculated is : {calculated_population}"
    )
    return {
        "latitude": request.latitude,
        "longitude": request.longitude,
        "radius_m": request.radius_m,
        "total_population_in_buffer": calculated_population,
    }
