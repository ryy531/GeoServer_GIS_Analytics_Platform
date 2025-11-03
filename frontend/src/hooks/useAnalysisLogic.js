// frontend/src/hooks/useAnalysisLogic.js
import { useRef } from "react";
import L from "leaflet";
import { getPopulationInBuffer } from "../services/apiService";

export const useAnalysisLogic = (map) => {
  const analysisCircleRef = useRef(null);
  const getColorByDensity = (density) => {
    if (density > 500) {
      return { color: "#d9534f", fillColor: "#d9534f" }; // Red
    } else if (density > 100) {
      return { color: "#f0ad4e", fillColor: "#f0ad4e" }; // Yellow
    } else {
      return { color: "#5cb85c", fillColor: "#5cb85c" }; // Green
    }
  };
  const displayPopup = (featureToShow, title, populationResult, e) => {
    const properties = featureToShow.properties;
    let popupContent = `<div style="max-height: 200px; overflow-y: auto; padding-right: 15px;">`;
    popupContent += `<b>${title}</b><br><hr>`;
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        popupContent += `<b>${key}:</b> ${properties[key]}<br>`;
      }
    }
    if (
      populationResult &&
      typeof populationResult.total_population_in_buffer === "number"
    ) {
      popupContent += `<hr><b>Population in Buffer:</b> ${populationResult.total_population_in_buffer.toLocaleString()}<br>`;
      popupContent += `<b>Population Density:</b> ${populationResult.population_density_per_km2.toFixed(
        2
      )} p/km²<br>`;
    }
    popupContent += `</div>`;
    // Use e.latlng to ensure the popup always appears at the click location
    L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);
  };

  const runAnalysis = (data, e) => {
    const pointFeature = data.features.find((feature) =>
      feature.id.startsWith("education_facilities_points")
    );

    if (pointFeature) {
      // 1. First, draw a temporary gray circle
      if (analysisCircleRef.current) {
        map.removeLayer(analysisCircleRef.current);
      }
      const lngLat = pointFeature.geometry.coordinates;
      const centerLatLng = [lngLat[1], lngLat[0]];
      const radiusMeters = 5000;
      analysisCircleRef.current = L.circle(centerLatLng, {
        radius: radiusMeters,
        color: "grey",
        fillColor: "#808080",
        fillOpacity: 0.2,
      }).addTo(map);

      // 2. Display a temporary Popup without population info
      displayPopup(pointFeature, "Facility Info", null, e);

      // 3. Prepare and send the backend request
      const analysisRequestData = {
        latitude: centerLatLng[0],
        longitude: centerLatLng[1],
        radius_m: radiusMeters,
      };
      getPopulationInBuffer(
        analysisRequestData.latitude,
        analysisRequestData.longitude,
        analysisRequestData.radius_m
      ).then((populationData) => {
        // 4. After the request succeeds, update the circle color and Popup content
        const density = populationData.population_density_per_km2;
        const newStyle = getColorByDensity(density);

        if (analysisCircleRef.current) {
          analysisCircleRef.current.setStyle(newStyle);
        }
        displayPopup(pointFeature, "Facility Info", populationData, e);
      });
    }
    // *** CRITICAL FIX: Removed the "else if" block that triggered zooming ***
    // Previously, the "else if" block here would catch the province polygon and trigger a zoom
    // Now all province logic is handled in the dblclick handler in MapClickHandler
    else {
      // If the click is not on a facility point (pointFeature), clear the analysis circle
      if (analysisCircleRef.current) {
        map.removeLayer(analysisCircleRef.current);
        analysisCircleRef.current = null;
      }
    }
  };
  return { runAnalysis };
};
