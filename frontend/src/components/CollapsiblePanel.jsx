import React, { useState } from "react";

function CollapsiblePanel({ title, children }) {
  const [isOpen, setIsOpen] = useState(true); // 默认展开

  return (
    <div className="collapsible-panel">
      <div className="panel-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>{title}</h3>
        <span>{isOpen ? "▼ 收起" : "▲ 展开"}</span>
      </div>
      <div className={`panel-content ${isOpen ? "open" : ""}`}>{children}</div>
    </div>
  );
}

export default CollapsiblePanel;
