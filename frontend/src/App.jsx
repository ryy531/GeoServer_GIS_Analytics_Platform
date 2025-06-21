import React from "react";
import { useState } from "react";
import "./App.css";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import AnalysisResultLayer from "./AnalysisResultLayer";
import MapClickHandler from "./MapClickHandler";

function App() {
  const initialPosition = [30.3, 69.3];
  const initialZoom = 6;
  const geoServerBaseUrl =
    "http://localhost:8080/geoserver/geo_server_practice/wms";
  const provinceLayerName = "geo_server_practice:admin_county_polygon";
  const educationLayerName = "geo_server_practice:education_facilities_points";
  const [analysisData, setAnalysisData] = useState(null);
  const [clickedPoint, setClickedPoint] = useState(null);

  const handleAnalysisData = (data, latlng) => {
    console.log("Data received in App component:", data);
    setAnalysisData(data);
    setClickedPoint(latlng);
  };

  return (
    <div className="App">
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy;{" "}
          <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{" "}
          contributors'
        />
        <WMSTileLayer
          url={geoServerBaseUrl}
          layers={provinceLayerName}
          format="image/png"
          transparent="true"
        />
        <WMSTileLayer
          url={geoServerBaseUrl}
          layers={educationLayerName}
          format="image/png"
          transparent="true"
        />
        <MapClickHandler onDataFetched={handleAnalysisData} />
        <AnalysisResultLayer
          analysisData={analysisData}
          clickedPoint={clickedPoint}
        />
      </MapContainer>
    </div>
  );
}

export default App;
