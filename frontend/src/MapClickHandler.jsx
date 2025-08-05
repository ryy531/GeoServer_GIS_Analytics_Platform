import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { findNearbyFacilities } from "./services/apiService";
import { useAnalysisLogic } from "./hooks/useAnalysisLogic";

function MapClickHandler({ onDataFetched }) {
  const map = useMap();
  const { runAnalysis } = useAnalysisLogic(map);
  useEffect(() => {
    if (!map) return;
    const handleClick = (e) => {
      console.log("Map clicked!", e.latlng);
      const requestData = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        radius_km: 5,
      };
      // const findNearByFacilitiesUrl =
      //   "http://127.0.0.1:8000/api/find_nearby_facilities";
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

      findNearbyFacilities(
        requestData.latitude,
        requestData.longitude,
        requestData.radius_km
      ).then((data) => {
        onDataFetched(data, e.latlng);
      });
      fetch(url.toString())
        .then((response) => response.json())
        .then((data) => {
          runAnalysis(data, e);
        });
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onDataFetched, runAnalysis]);
  return null;
}
export default MapClickHandler;
