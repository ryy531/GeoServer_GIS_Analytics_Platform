import { useEffect } from "react";
import { useMap } from "react-leaflet";

function MapClickHandler({ onDataFetched }) {
  const map = useMap();
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
      fetch(findNearByFacilitiesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })
        .then((response) => response.json())
        .then((data) => {
          onDataFetched(data, e.latlng);
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
