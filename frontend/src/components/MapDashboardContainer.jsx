// File: frontend/src/components/MapDashboardContainer.jsx

import React, { useEffect, useState } from "react";
// Import all necessary functions from our apiService
import {
  getProvinces,
  getProvinceBounds,
  getFacilityStats,
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

// --- Helper Component: MapController ---
// Defined outside the main component to prevent re-creation on every render.
// Its job is to perform map actions like fitBounds or resetting the view.
function MapController({ bounds, initialPosition, initialZoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    } else {
      // If no bounds are provided, reset the view to the initial nationwide position.
      map.setView(initialPosition, initialZoom);
    }
  }, [bounds, map, initialPosition, initialZoom]);
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
    if (selectedProvince) {
      // 1. Fetch the geographical bounds for the selected province to zoom the map.
      getProvinceBounds(selectedProvince)
        .then((newBounds) => {
          setBounds(newBounds);
        })
        .catch((error) =>
          console.error("Failed to fetch province bounds:", error)
        );

      // 2. Fetch the facility statistics for the selected province.
      getFacilityStats(selectedProvince)
        .then((newStats) => {
          setStats(newStats);
        })
        .catch((error) =>
          console.error("Failed to fetch facility stats:", error)
        );

      // 3. Create a CQL filter string to filter map layers.
      // We must escape any single quotes in the province name to prevent CQL injection or errors.
      // For example, a name like "d'Arcy" would become "d''Arcy".
      const escapedProvince = selectedProvince.replace(/'/g, "''");
      const filter = `province_name = '${escapedProvince}'`;
      console.log("Generated CQL Filter:", filter); // 添加一句日志，方便我们调试
      setCqlFilter(filter);
    } else {
      // If no province is selected, reset all related states.
      setCqlFilter(null);
      setStats(null);
      setBounds(null); // Optional: you might want to reset the view to nationwide here.
    }
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
    </div>
  );
}

export default MapDashboardContainer;
