// File: frontend/src/components/CollapsibleSidebar.jsx
// Final version with a dedicated tab/button

import React from "react";

function CollapsibleSidebar({ title, isOpen, onToggle, children }) {
  return (
    // The main container that slides in and out
    <div className={`collapsible-sidebar ${isOpen ? "open" : "closed"}`}>
      {/* The button is now the "handle" that sticks out */}
      <button onClick={onToggle} className="sidebar-toggle-button">
        {isOpen ? `▶ ${title}` : `◀  ${title}`}
      </button>

      {/* The main content panel */}
      <div className="sidebar-panel">
        <div className="sidebar-header">
          {/* We can repeat the title here if we want, or remove it */}
          <h3>{title}</h3>
        </div>
        <div className="sidebar-content">{children}</div>
      </div>
    </div>
  );
}

export default CollapsibleSidebar;
