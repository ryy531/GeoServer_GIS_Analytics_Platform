// frontend/src/components/MapClickHandler.jsx
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { findNearbyFacilities } from "../services/apiService";
import { useAnalysisLogic } from "../hooks/useAnalysisLogic";

// Receive onProvinceSelect prop
function MapClickHandler({ onDataFetched, onProvinceSelect }) {
  const map = useMap();
  const { runAnalysis } = useAnalysisLogic(map);

  // Use refs to hold the latest callbacks. This avoids adding them to the
  // useEffect dependency array, which would cause the effect to re-run
  // unnecessarily and re-attach event listeners.
  const onDataFetchedRef = useRef(onDataFetched);
  const onProvinceSelectRef = useRef(onProvinceSelect);

  useEffect(() => {
    onDataFetchedRef.current = onDataFetched;
    onProvinceSelectRef.current = onProvinceSelect;
  }, [onDataFetched, onProvinceSelect]);

  useEffect(() => {
    if (!map) return;

    let clickTimer = null;

    // --- Single Click Handler ---
    const handleSingleClick = (e) => {
      console.log("Map single-clicked!", e.latlng);
      const requestData = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        radius_km: 5,
      };

      findNearbyFacilities(
        requestData.latitude,
        requestData.longitude,
        requestData.radius_km
      ).then((data) => {
        onDataFetchedRef.current(data, e.latlng);
      });

      const wmsBaseUrl = import.meta.env.VITE_GEOSERVER_BASE_URL;
      const layerName = "geo_server_practice:education_facilities_points";

      const mapBounds = map.getBounds().toBBoxString();
      const mapSize = map.getSize();
      const crs = "EPSG:4326";
      const clickPoint = e.containerPoint;
      const params = {
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetFeatureInfo",
        LAYERS: layerName,
        QUERY_LAYERS: layerName, // Query only facilities
        INFO_FORMAT: "application/json",
        STYLES: "",
        BBOX: mapBounds,
        WIDTH: mapSize.x,
        HEIGHT: mapSize.y,
        SRS: crs,
        X: Math.round(clickPoint.x),
        Y: Math.round(clickPoint.y),
        BUFFER: 10,
      };
      const url = new URL(wmsBaseUrl);
      url.search = new URLSearchParams(params).toString();

      console.log(
        "Generated GetFeatureInfo URL (Single Click):",
        url.toString()
      );

      fetch(url.toString())
        .then((response) => response.json())
        .then((data) => runAnalysis(data, e));
    };

    // --- Double Click Handler ---
    const handleDoubleClick = (e) => {
      console.log("Map double-clicked!", e.latlng);
      const wmsBaseUrl = import.meta.env.VITE_GEOSERVER_BASE_URL;
      const layerName = "geo_server_practice:admin_county_polygon";

      const { x: width, y: height } = map.getSize();
      const bounds = map.getBounds().toBBoxString();
      const crs = "EPSG:4326";
      const { x, y } = e.containerPoint;
      const params = {
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetFeatureInfo",
        LAYERS: layerName,
        QUERY_LAYERS: layerName, // Query only provinces
        INFO_FORMAT: "application/json",
        STYLES: "",
        BBOX: bounds,
        WIDTH: width,
        HEIGHT: height,
        SRS: crs,
        X: Math.round(x),
        Y: Math.round(y),
        BUFFER: 10,
      };
      const url = new URL(wmsBaseUrl);
      url.search = new URLSearchParams(params).toString();

      fetch(url.toString())
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const provinceName =
              feature.properties.province_name ||
              feature.properties.name ||
              feature.properties.NAME;

            // Client-side bounding box calculation
            if (feature.geometry) {
              const geoJsonLayer = L.geoJSON(feature.geometry);
              const bounds = geoJsonLayer.getBounds();
              map.fitBounds(bounds, { padding: [50, 50] });
            } else if (feature.bbox) {
              // Fallback to server-provided bbox if it exists
              const bounds = L.latLngBounds([
                [feature.bbox[1], feature.bbox[0]],
                [feature.bbox[3], feature.bbox[2]],
              ]);
              map.fitBounds(bounds, { padding: [50, 50] });
            }

            if (provinceName && onProvinceSelectRef.current) {
              console.log("Province selected:", provinceName);
              onProvinceSelectRef.current(provinceName);
            }
          }
        })
        .catch((error) => {
          console.error("Error during GetFeatureInfo request:", error); // Log any fetch error
        });
    };

    // --- Unified Click Event Logic ---
    const onClick = (e) => {
      // Only set a timer if one isn't already running
      if (!clickTimer) {
        clickTimer = setTimeout(() => {
          handleSingleClick(e);
          // Reset timer after execution
          clickTimer = null;
        }, 250);
      }
    };

    const onDoubleClick = (e) => {
      // If a double click occurs, clear the single click timer
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      handleDoubleClick(e);
    };

    map.on("click", onClick);
    map.on("dblclick", onDoubleClick);

    return () => {
      // Cleanup on component unmount
      map.off("click", onClick);
      map.off("dblclick", onDoubleClick);
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
    };
  }, [map, runAnalysis]); // Keep dependencies minimal to avoid re-binding events.

  return null;
}
export default MapClickHandler;
