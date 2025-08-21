// File: frontend/src/components/MapDashboardContainer.jsx

import React, { useEffect, useState, useRef } from "react";
// Import all necessary functions from our apiService
import {
  getProvinces,
  getProvinceBounds,
  getFacilityStats,
  getPopulationPyramid,
} from "../services/apiService";
import "../App.css";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  LayersControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import AnalysisResultLayer from "./AnalysisResultLayer";
import MapClickHandler from "./MapClickHandler";
import Dashboard from "./Dashboard";
import CollapsiblePanel from "./CollapsiblePanel";
import PopulationPyramidChart from "./PopulationPyramidChart";

// --- Helper Component: MapController ---
// Defined outside the main component to prevent re-creation on every render.
// Its job is to perform map actions like fitBounds or resetting the view.
function MapController({
  bounds,
  selectedProvince,
  initialPosition,
  initialZoom,
}) {
  const map = useMap();
  const lastFittedProvinceRef = useRef(null);

  useEffect(() => {
    // Only refit the map if the selected province has actually changed.
    // This prevents unwanted re-focusing when other parts of the app cause a re-render.
    if (selectedProvince !== lastFittedProvinceRef.current) {
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // This handles the "Nationwide" case where bounds are null.
        map.setView(initialPosition, initialZoom);
      }
      // Update the ref to the province we just fitted.
      lastFittedProvinceRef.current = selectedProvince;
    }
  }, [bounds, selectedProvince, map, initialPosition, initialZoom]);
  return null;
}

// --- Main Container Component ---
// This component acts as the "brain" for our dashboard and map.
function MapDashboardContainer() {
  // --- State Management ---
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [bounds, setBounds] = useState(null);
  const [cqlFilter, setCqlFilter] = useState(null);
  const [stats, setStats] = useState(null);
  const [populationData, setPopulationData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [clickedPoint, setClickedPoint] = useState(null);

  // --- Map Configuration Constants ---
  const initialPosition = [30.3, 69.3];
  const initialZoom = 6;
  const geoServerBaseUrl =
    "http://localhost:8080/geoserver/geo_server_practice/wms";
  const provinceLayerName = "geo_server_practice:admin_county_polygon";
  const educationLayerName = "geo_server_practice:education_facilities_points";

  // --- Data Fetching Effects ---

  // Effect to fetch the list of provinces only once when the component mounts.
  useEffect(() => {
    getProvinces()
      .then((data) => {
        setProvinces(data);
      })
      .catch((error) => {
        console.error("Failed to fetch provinces:", error);
      });
  }, []); // Empty dependency array ensures this runs only once.

  // Effect to run whenever the selectedProvince state changes.
  useEffect(() => {
    // This flag prevents state updates if the component unmounts or if the
    // dependency (selectedProvince) changes before the async operations complete.
    let isMounted = true;

    if (selectedProvince) {
      // 1. Fetch the geographical bounds for the selected province to zoom the map.
      getProvinceBounds(selectedProvince)
        .then((newBounds) => {
          if (isMounted) setBounds(newBounds);
        })
        .catch((error) =>
          console.error("Failed to fetch province bounds:", error)
        );
      // 2. Fetch the facility statistics for the selected province.
      getFacilityStats(selectedProvince)
        .then((newStats) => {
          if (isMounted) setStats(newStats);
        })
        .catch((error) =>
          console.error("Failed to fetch facility stats:", error)
        );

      // Fetch population pyramid data for the selected province.
      getPopulationPyramid(selectedProvince)
        .then((data) => {
          if (isMounted) setPopulationData(data);
        })
        .catch((error) =>
          console.error("Failed to fetch population pyramid data:", error)
        );

      // 3. Create a CQL filter string to filter map layers.
      const escapedProvince = selectedProvince.replace(/'/g, "''");
      const filter = `province_name = '${escapedProvince}'`;
      if (isMounted) setCqlFilter(filter);
    } else {
      // If no province is selected, reset all related states.
      if (isMounted) {
        setCqlFilter(null);
        setStats(null);
        setBounds(null);
      }

      // Fetch nationwide population data when no province is selected.
      getPopulationPyramid("Nationwide")
        .then((data) => {
          if (isMounted) setPopulationData(data);
        })
        .catch((error) =>
          console.error("Failed to fetch population pyramid data:", error)
        );
    }

    // Cleanup function to run when the component unmounts or before the effect re-runs.
    // This prevents setting state on an unmounted component and fixes race conditions.
    return () => {
      isMounted = false;
    };
  }, [selectedProvince]); // This effect depends on the selectedProvince state.

  // --- Event Handlers ---
  const handleAnalysisData = (data, latlng) => {
    console.log("Data received from click handler:", data);
    setAnalysisData(data);
    setClickedPoint(latlng);
  };

  // --- Render ---
  return (
    <div className="App">
      <Dashboard
        provinces={provinces}
        selectedProvince={selectedProvince}
        onProvinceChange={setSelectedProvince}
        stats={stats}
      />
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        style={{ height: "100vh", width: "100%" }}
      >
        <MapController
          bounds={bounds}
          selectedProvince={selectedProvince}
          initialPosition={initialPosition}
          initialZoom={initialZoom}
        />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Provinces">
            <WMSTileLayer
              url={geoServerBaseUrl}
              layers={provinceLayerName}
              format="image/png"
              transparent={true}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Education Facilities">
            <WMSTileLayer
              key={cqlFilter || "all-facilities"}
              url={geoServerBaseUrl}
              layers={educationLayerName}
              format="image/png"
              transparent={true}
              // --- 这是修正后的关键部分 ---
              // 使用三元运算符：如果 cqlFilter 有值，就创建 params 对象；否则，就传一个空对象。
              params={cqlFilter ? { cql_filter: cqlFilter } : {}}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Population (Nationwide)">
            <WMSTileLayer
              key={cqlFilter || "all-population"} // Also apply the filter to the population layer
              url={geoServerBaseUrl}
              layers="geo_server_practice:pak_unadj_constrained"
              format="image/png"
              transparent={true}
              // Correctly apply the filter only when it exists
              params={cqlFilter ? { cql_filter: cqlFilter } : {}}
            />
          </LayersControl.Overlay>
        </LayersControl>

        <MapClickHandler onDataFetched={handleAnalysisData} />
        <AnalysisResultLayer
          analysisData={analysisData}
          clickedPoint={clickedPoint}
        />
      </MapContainer>

      {/* --- 新的可折叠面板，用于显示图表 --- */}
      {populationData && (
        <CollapsiblePanel
          title={`Population Pyramid: ${selectedProvince || "Nationwide"}`}
        >
          <PopulationPyramidChart data={populationData} />
        </CollapsiblePanel>
      )}
    </div>
  );
}

export default MapDashboardContainer;
