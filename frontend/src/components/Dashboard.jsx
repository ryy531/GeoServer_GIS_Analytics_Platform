// File: frontend/src/components/Dashboard.jsx

import React from "react";

function Dashboard({ provinces, selectedProvince, onProvinceChange, stats }) {
  return (
    <div className="dashboard-container">
      <select
        value={selectedProvince}
        onChange={(e) => onProvinceChange(e.target.value)}
      >
        <option value="">-- Nationwide --</option>
        {provinces.map((province, index) => (
          <option key={index} value={province}>
            {province}
          </option>
        ))}
      </select>

      {/* --- Statistics Display Area --- */}
      {stats && (
        <div className="stats-display">
          <hr />
          <h3>{stats.province_name}</h3>
          <p>
            Facilities found:
            <strong>
              {" "}
              {stats.province_count} / {stats.total_count}{" "}
            </strong>
            (Nationwide)
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
