// File: frontend/src/services/apiService.js

const API_BASE_URL = "http://127.0.0.1:8000/api";

/**
 * Fetches nearby facilities from the backend.
 * The endpoint path must exactly match the one in the backend router.
 */
export const findNearbyFacilities = (latitude, longitude, radius_km) => {
  const requestBody = {
    latitude,
    longitude,
    radius_km,
  };

  // Corrected path: "/find_nearby_facilities"
  return fetch(`${API_BASE_URL}/find_nearby_facilities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  }).then((response) => response.json());
};

/**
 * Fetches the calculated population within a buffer from the backend.
 * Renamed for clarity.
 */
export const getPopulationInBuffer = (latitude, longitude, radius_m) => {
  const requestBody = {
    latitude,
    longitude,
    radius_m,
  };

  // Corrected path: "/population_in_buffer"
  return fetch(`${API_BASE_URL}/population_in_buffer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  }).then((response) => response.json());
};
