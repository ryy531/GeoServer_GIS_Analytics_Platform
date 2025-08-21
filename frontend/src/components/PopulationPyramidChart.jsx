import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// 这个辅助函数将处理从API获取的原始数据，并将其转换为Chart.js可以理解的格式。
const processDataForChart = (apiData) => {
  if (!apiData) {
    return { labels: [], datasets: [] };
  }

  // 定义年龄段标签
  const labels = [
    "0-4",
    "5-9",
    "10-14",
    "15-19",
    "20-24",
    "25-29",
    "30-34",
    "35-39",
    "40-44",
    "45-49",
    "50-54",
    "55-59",
    "60-64",
    "65-69",
    "70-74",
    "75-79",
    "80+",
  ];

  // 从API数据中提取并组合年龄组数据
  const ageGroups = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
  ];

  const femaleData = [
    (apiData.f_0 || 0) + (apiData.f_1 || 0), // 合并 0岁 和 1-4岁
    ...ageGroups.map((age) => apiData[`f_${age}`] || 0),
  ];

  // 男性数据设为负数，以便在图表上显示在左侧
  const maleData = [
    -((apiData.m_0 || 0) + (apiData.m_1 || 0)),
    ...ageGroups.map((age) => -(apiData[`m_${age}`] || 0)),
  ];

  return {
    labels: labels,
    datasets: [
      {
        label: "Male",
        data: maleData,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgb(54, 162, 235)",
        borderWidth: 1,
      },
      {
        label: "Female",
        data: femaleData,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  };
};

function PopulationPyramidChart({ data }) {
  const chartData = processDataForChart(data);

  const options = {
    indexAxis: "y", // 这使得条形图变为水平方向
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true, // 堆叠条形图
        ticks: {
          // 这个回调函数将X轴的标签格式化为正数
          callback: function (value) {
            return Math.abs(value).toLocaleString();
          },
          color: "#333", // 设置X轴刻度文字颜色
        },
        title: {
          display: true,
          text: "Population Count",
          color: "#333", // 设置X轴标题颜色
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: "#333", // 设置Y轴刻度文字颜色
        },
        title: { display: true, text: "Age Group", color: "#333" }, // 设置Y轴标题颜色
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#333", // 设置图例文字颜色
        },
      },
      tooltip: {
        // 这个回调函数将提示框中的值格式化为正数
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${Math.abs(
              context.raw
            ).toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "400px", width: "100%", marginTop: "20px" }}>
      <Bar options={options} data={chartData} />
    </div>
  );
}

export default PopulationPyramidChart;
