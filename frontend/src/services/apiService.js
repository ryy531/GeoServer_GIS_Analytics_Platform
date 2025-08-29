// File: frontend/src/services/apiService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
export const getProvinces = () => {
  return fetch(`${API_BASE_URL}/provinces`).then((response) => response.json());
};

export const getProvinceBounds = (provinceName) => {
  return fetch(`${API_BASE_URL}/province_bounds/${provinceName}`).then(
    (response) => response.json()
  );
};

export const getFacilityStats = (provinceName) => {
  // We need to ensure the provinceName is properly encoded for a URL
  const encodedProvinceName = encodeURIComponent(provinceName);

  return fetch(`${API_BASE_URL}/facility_stats/${encodedProvinceName}`, {
    // Add this credentials option
    credentials: "include",
  }).then((response) => response.json());
};

export const getPopulationPyramid = (provinceName) => {
  // We need to ensure the provinceName is properly encoded for a URL
  const encodedProvinceName = encodeURIComponent(provinceName);

  return fetch(
    `${API_BASE_URL}/population_pyramid/${encodedProvinceName}`
  ).then((response) => response.json());
};
