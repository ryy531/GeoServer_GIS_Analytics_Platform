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

const processDataForChart = (apiData) => {
  if (!apiData) {
    return { labels: [], datasets: [] };
  }

  // Define age group labels
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

  // Extract and combine age group data from API data
  const ageGroups = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
  ];

  const femaleData = [
    (apiData.f_0 || 0) + (apiData.f_1 || 0), // Combine 0 years old and 1-4 years old
    ...ageGroups.map((age) => apiData[`f_${age}`] || 0),
  ];

  // Male data is set to negative to display on the left side of the chart
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
    indexAxis: "y", // This makes the bar chart horizontal
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true, // Stacked bar chart
        ticks: {
          // This callback function formats the X-axis labels as positive numbers
          callback: function (value) {
            return Math.abs(value).toLocaleString();
          },
          color: "#333", // Set X-axis tick label color
        },
        title: {
          display: true,
          text: "Population Count",
          color: "#333", // Set X-axis title color
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: "#333", // Set Y-axis tick label color
        },
        title: { display: true, text: "Age Group", color: "#333" }, // Set Y-axis title color
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#333", // Set legend text color
        },
      },
      tooltip: {
        // This callback function formats the values in the tooltip as positive numbers
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
