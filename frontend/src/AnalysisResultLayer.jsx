import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

function AnalysisResultLayer({ analysisData, clickedPoint }) {
  const map = useMap();
  useEffect(() => {
    if (!clickedPoint) return;
    const layerGroup = L.layerGroup().addTo(map);
    if (
      analysisData &&
      analysisData.features &&
      analysisData.features.length > 0
    ) {
      var allData = analysisData.features;
      allData.forEach(function (feature) {
        // --- Start of the block to replace ---

        var coordinates = feature.geometry.coordinates;
        var schoolLatLng = [coordinates[1], coordinates[0]]; // Correctly reverse coordinates
        let schoolType = feature.properties.amenity;

        // --- This is the corrected logic for the control point ---
        let startPoint = L.latLng(clickedPoint.lat, clickedPoint.lng);
        let endPoint = L.latLng(schoolLatLng);

        // 1. Calculate the difference vector
        let latDiff = endPoint.lat - startPoint.lat;
        let lngDiff = endPoint.lng - startPoint.lng;

        // 2. Calculate the perpendicular offset
        let bendFactor = -0.1; // You can adjust this value
        let perpendicularOffsetX = -lngDiff * bendFactor;
        let perpendicularOffsetY = latDiff * bendFactor;

        // 3. Calculate the midpoint
        let midPointLat = (startPoint.lat + endPoint.lat) / 2;
        let midPointLng = (startPoint.lng + endPoint.lng) / 2;

        // 4. Calculate the final control point by applying the offset to the midpoint
        let controlPoint = L.latLng([
          midPointLat + perpendicularOffsetY,
          midPointLng + perpendicularOffsetX,
        ]);
        // --- End of the corrected logic ---

        var pointsForCurve = [];

        for (let t = 0; t <= 1; t += 0.05) {
          let lat =
            (1 - t) ** 2 * startPoint.lat +
            2 * (1 - t) * t * controlPoint.lat +
            t ** 2 * endPoint.lat;
          let lng =
            (1 - t) ** 2 * startPoint.lng +
            2 * (1 - t) * t * controlPoint.lng +
            t ** 2 * endPoint.lng;
          pointsForCurve.push([lat, lng]);
        }

        const colorMap = {
          university: "red",
          school: "green",
          library: "orange",
          conference_centre: "blue",
          restaurant: "purple",
          kindergarten: "yellow",
          college: "darkgreen",
        };

        let lineColor = colorMap[schoolType] || "gray";

        L.polyline(pointsForCurve, { color: lineColor, weight: 2 }).addTo(
          layerGroup
        );
      });
      L.marker(clickedPoint).addTo(layerGroup);
    } else {
      L.marker(clickedPoint)
        .bindPopup("No facilities found in this radius")
        .addTo(layerGroup).openPopup;
    }
    return () => {
      map.removeLayer(layerGroup);
    };
  }, [analysisData, clickedPoint, map]);
  return null;
}
export default AnalysisResultLayer;
