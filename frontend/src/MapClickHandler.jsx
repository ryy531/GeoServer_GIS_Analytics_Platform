import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function MapClickHandler({ onDataFetched }) {
  const map = useMap();
  const analysisCircleRef = useRef(null);
  useEffect(() => {
    if (!map) return;
    const handleClick = (e) => {
      console.log("Map clicked!", e.latlng);
      const requestData = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        radius_km: 5,
      };
      const findNearByFacilitiesUrl =
        "http://127.0.0.1:8000/api/find_nearby_facilities";
      const wmsBaseUrl =
        "http://localhost:8080/geoserver/geo_server_practice/wms";
      const layerName =
        "geo_server_practice:education_facilities_points,geo_server_practice:admin_county_polygon";
      const mapBounds = map.getBounds().toBBoxString();
      const mapSize = map.getSize();
      const crs = "EPSG:4326";
      const clickPoint = e.containerPoint;
      const params = {
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetFeatureInfo",
        LAYERS: layerName,
        QUERY_LAYERS: layerName,
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
      console.log("Generated GetFeatureInfo URL:", url.toString());

      fetch(findNearByFacilitiesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })
        .then((response) => response.json())
        .then((data) => {
          onDataFetched(data, e.latlng);
        });
      fetch(url.toString())
        .then((response) => response.json())
        .then((data) => {
          const displayPopup = (featureToShow, title, populationCount) => {
            const properties = featureToShow.properties;
            let popupContent = `<div style="max-height: 150px; overflow-y: auto; padding-right: 15px;">`;
            popupContent += `<b>${title}</b><br><hr>`;
            for (const key in properties) {
              if (Object.prototype.hasOwnProperty.call(properties, key)) {
                popupContent += `<b>${key}:</b> ${properties[key]}<br>`;
              }
            }
            if (typeof populationCount === "number") {
              popupContent += `<hr><b>Population in Buffer:</b> ${populationCount.toLocaleString()}<br>`;
            }
            L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);
          };

          const pointFeature = data.features.find((feature) =>
            feature.id.startsWith("education_facilities_points")
          );
          if (pointFeature) {
            console.log(
              "Prioritizing Point Feature:",
              pointFeature.properties.name
            );

            if (analysisCircleRef.current) {
              map.removeLayer(analysisCircleRef.current);
            }
            const lngLat = pointFeature.geometry.coordinates;
            const centerLatLng = [lngLat[1], lngLat[0]];
            const radiusMeters = 5000;
            analysisCircleRef.current = L.circle(centerLatLng, {
              radius: radiusMeters,
              color: "green",
              fillColor: "#28a745",
              fillOpacity: 0.2,
            }).addTo(map);
            const analysisRequestData = {
              latitude: centerLatLng[0],
              longitude: centerLatLng[1],
              radius_m: radiusMeters,
            };
            fetch("http://127.0.0.1:8000/api/population_in_buffer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(analysisRequestData),
            })
              .then((response) => response.json())
              .then((data) => {
                const count = data.total_population_in_buffer;
                displayPopup(pointFeature, "Facility Info", count);
              });
          } else if (data.features && data.features.length > 0) {
            const polygonFeature = data.features[0];
            console.log(
              "No point found, displaying Polygon Feature:",
              polygonFeature.properties.name_en
            );
            displayPopup(polygonFeature, "Province Info");
          } else {
            console.log("No features found at this location.");
          }
        });
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onDataFetched]);
  return null;
}
export default MapClickHandler;
