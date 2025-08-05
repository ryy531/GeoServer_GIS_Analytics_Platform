import { useRef } from "react";
import L from "leaflet";
import { getPopulationInBuffer } from "../services/apiService";

export const useAnalysisLogic = (map) => {
  const analysisCircleRef = useRef(null);
  const getColorByDensity = (density) => {
    if (density > 500) {
      return { color: "#d9534f", fillColor: "#d9534f" }; // 红色
    } else if (density > 100) {
      return { color: "#f0ad4e", fillColor: "#f0ad4e" }; // 黄色
    } else {
      return { color: "#5cb85c", fillColor: "#5cb85c" }; // 绿色
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
    L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);
  };
  const runAnalysis = (data, e) => {
    const pointFeature = data.features.find((feature) =>
      feature.id.startsWith("education_facilities_points")
    );

    if (pointFeature) {
      // 1. 先画一个灰色的临时圆圈，给用户即时反馈
      if (analysisCircleRef.current) {
        map.removeLayer(analysisCircleRef.current);
      }
      const lngLat = pointFeature.geometry.coordinates;
      const centerLatLng = [lngLat[1], lngLat[0]];
      const radiusMeters = 5000;
      analysisCircleRef.current = L.circle(centerLatLng, {
        radius: radiusMeters,
        color: "grey", // 临时占位颜色
        fillColor: "#808080",
        fillOpacity: 0.2,
      }).addTo(map);

      // 2. 显示一个临时的、不含人口信息的 Popup
      displayPopup(pointFeature, "Facility Info", null, e);

      // 3. 准备并发送后端请求
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
        // 这是从我们后端返回的人口和密度数据
        // 4. 请求成功后，更新圆圈颜色和 Popup 内容
        const density = populationData.population_density_per_km2;
        const newStyle = getColorByDensity(density);

        if (analysisCircleRef.current) {
          analysisCircleRef.current.setStyle(newStyle);
        }

        // 重新调用 displayPopup，这次传入完整的人口数据
        displayPopup(pointFeature, "Facility Info", populationData, e);
      });
    } else if (data.features && data.features.length > 0) {
      // 如果点击的是多边形，逻辑不变
      if (analysisCircleRef.current) {
        // 如果之前有分析圈，就清除掉
        map.removeLayer(analysisCircleRef.current);
        analysisCircleRef.current = null;
      }
      const polygonFeature = data.features[0];
      displayPopup(polygonFeature, "Province Info", null, e);
    } else {
      // 如果点击的是空白，逻辑不变
      if (analysisCircleRef.current) {
        map.removeLayer(analysisCircleRef.current);
        analysisCircleRef.current = null;
      }
    }
  };
  return { runAnalysis };
};
