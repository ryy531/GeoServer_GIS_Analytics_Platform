// File: frontend/src/components/MapDashboardContainer.jsx

// --- React and Library Imports ---
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  LayersControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// --- Service Imports ---
// We import all our data-fetching functions from a dedicated service file.
import {
  getProvinces,
  getProvinceBounds,
  getFacilityStats,
  getPopulationPyramid,
} from "../services/apiService";

// --- Component Imports ---
// We import all the child components that make up our UI.
import Dashboard from "./Dashboard";
import CollapsiblePanel from "./CollapsiblePanel";
import PopulationPyramidChart from "./PopulationPyramidChart";
import MapClickHandler from "./MapClickHandler";
import AnalysisResultLayer from "./AnalysisResultLayer";
import CollapsibleSidebar from "./CollapsibleSidebar"; // The new sidebar component
import GeoAIAnalyzer from "./GeoAIAnalyzer"; // The new AI analyzer component

// --- Styling ---
import "../App.css";

// =================================================================
//  Helper Component: MapController
//  This component is a child of MapContainer and allows us to
//  programmatically control the map's view (e.g., zoom, pan).
// =================================================================
function MapController({ bounds, initialPosition, initialZoom }) {
  // Get the map instance from the React-Leaflet context.
  const map = useMap();

  // Use a ref to track the previous value of bounds to prevent unnecessary re-renders.
  const prevBoundsRef = useRef();

  // This effect now only triggers a map view change when the `bounds` prop *actually* changes,
  // ignoring changes from parent component re-renders where `bounds` remains the same.
  useEffect(() => {
    // Convert bounds to a string for simple comparison. null becomes "null".
    const currentBoundsStr = JSON.stringify(bounds);
    const prevBoundsStr = JSON.stringify(prevBoundsRef.current);

    if (currentBoundsStr !== prevBoundsStr) {
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView(initialPosition, initialZoom);
      }
    }
    // Update the ref to the current bounds for the next render.
    prevBoundsRef.current = bounds;
  }, [bounds, map, initialPosition, initialZoom]);

  return null; // This component does not render any visible HTML.
}

// =================================================================
//  Main Component: MapDashboardContainer
//  This is the primary component that orchestrates the entire application.
//  It manages state, fetches data, and arranges all other components.
// =================================================================
function MapDashboardContainer() {
  // --- State Management ---
  // We use the `useState` hook to manage the application's state.
  const [provinces, setProvinces] = useState([]); // Holds the list of all provinces for the dropdown.
  const [selectedProvince, setSelectedProvince] = useState(""); // Tracks the currently selected province.
  const [bounds, setBounds] = useState(null); // The map bounds for the selected province.
  const [cqlFilter, setCqlFilter] = useState(null); // The CQL filter string for GeoServer layers.
  const [stats, setStats] = useState(null); // Facility statistics for the dashboard.
  const [populationData, setPopulationData] = useState(null); // Data for the population pyramid chart.
  const [analysisData, setAnalysisData] = useState(null); // Data from nearby facility analysis.
  const [clickedPoint, setClickedPoint] = useState(null); // Lat/Lng of the user's click on the map.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- Configuration Constants ---
  // Storing configuration values here makes them easy to change.
  const initialPosition = [30.3, 69.3];
  const initialZoom = 6;
  const geoServerBaseUrl = import.meta.env.VITE_GEOSERVER_BASE_URL;
  const provinceLayerName = "geo_server_practice:admin_county_polygon";
  const educationLayerName = "geo_server_practice:education_facilities_points";

  // --- Data Fetching Effects ---

  // Effect #1: Fetch the list of provinces.
  // This runs only once when the component first mounts.
  useEffect(() => {
    getProvinces()
      .then((data) => {
        setProvinces(data);
      })
      .catch((error) => {
        console.error("Failed to fetch provinces:", error);
      });
  }, []); // The empty dependency array `[]` ensures it runs only once.

  // Effect #2: Fetch data for the selected province.
  // This runs whenever the `selectedProvince` state changes.
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted components.

    if (selectedProvince) {
      // --- A province is selected ---
      // 1. Fetch its geographical bounds to zoom the map.
      getProvinceBounds(selectedProvince).then((newBounds) => {
        if (isMounted) setBounds(newBounds);
      });
      // 2. Fetch its facility statistics for the dashboard.
      getFacilityStats(selectedProvince).then((newStats) => {
        if (isMounted) setStats(newStats);
      });
      // 3. Fetch its population data for the pyramid chart.
      getPopulationPyramid(selectedProvince).then((data) => {
        if (isMounted) setPopulationData(data);
      });
      // 4. Create a CQL filter to apply to the WMS layers.
      const escapedProvince = selectedProvince.replace(/'/g, "''");
      const filter = `province_name = '${escapedProvince}'`;
      if (isMounted) setCqlFilter(filter);
    } else {
      // --- "Nationwide" is selected ---
      // Reset all province-specific state.
      if (isMounted) {
        setCqlFilter(null);
        setStats(null);
        setBounds(null);
      }
      // Fetch the nationwide population data.
      getPopulationPyramid("Nationwide").then((data) => {
        if (isMounted) setPopulationData(data);
      });
    }

    // Cleanup function: runs when the component unmounts or before the effect re-runs.
    return () => {
      isMounted = false;
    };
  }, [selectedProvince]); // This effect depends on the `selectedProvince` state.

  // --- Event Handlers ---
  // Wrap the handler in useCallback to prevent it from being recreated on every render.
  // This stabilizes the prop passed to MapClickHandler and prevents unnecessary effect re-runs.
  const handleAnalysisData = useCallback((data, latlng) => {
    console.log("Data received from click handler:", data, latlng);
    setAnalysisData(data); // Update analysis results
    setClickedPoint(latlng); // Update the location of the click
  }, []); // Empty dependency array means the function is created only once.

  // --- Render ---
  // This JSX defines the structure of our application's UI.
  return (
    <div className="App">
      {/* Top-left dashboard for province selection */}
      <Dashboard
        provinces={provinces}
        selectedProvince={selectedProvince}
        onProvinceChange={setSelectedProvince}
        stats={stats}
      />

      {/* The main interactive map */}
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        doubleClickZoom={false} // <-- **CRITICAL FIX**: Disable default double-click zoom behavior
        style={{ height: "100vh", width: "100%" }}
      >
        <MapController
          bounds={bounds}
          initialPosition={initialPosition}
          initialZoom={initialZoom}
        />

        {/* Layer control for switching basemaps and toggling overlays */}
        <LayersControl position="topright">
          {/* Base Maps */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri &mdash; Source: Esri & others"
            />
          </LayersControl.BaseLayer>

          {/* Data Overlays from GeoServer */}
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
              key={cqlFilter || "all-facilities"} // `key` helps React re-render the layer when the filter changes
              url={geoServerBaseUrl}
              layers={educationLayerName}
              format="image/png"
              transparent={true}
              params={cqlFilter ? { cql_filter: cqlFilter } : {}}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Population (Nationwide)">
            <WMSTileLayer
              key={cqlFilter || "all-population"}
              url={geoServerBaseUrl}
              layers="geo_server_practice:pak_unadj_constrained"
              format="image/png"
              transparent={true}
              params={cqlFilter ? { cql_filter: cqlFilter } : {}}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* Components for handling map interactions and displaying results */}
        <MapClickHandler
          onDataFetched={handleAnalysisData}
          onProvinceSelect={setSelectedProvince}
        />
        <AnalysisResultLayer
          analysisData={analysisData}
          clickedPoint={clickedPoint}
        />
      </MapContainer>

      {/* The new collapsible sidebar on the right for AI tools */}
      <CollapsibleSidebar
        title="GeoAI Analyzer"
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
      >
        <GeoAIAnalyzer />
      </CollapsibleSidebar>

      {/* The collapsible panel at the bottom for charts */}
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
