import React from "react";
import "./AccordionSection.css";

function AccordionSection({ isExpanded, onToggle, icon, title, color, children }) {
  return (
    <div className="accordion-section">
      <div
        className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
        onClick={onToggle}
        style={{
          borderLeft: `4px solid ${color}`,
          background: isExpanded ? 'rgba(40, 40, 50, 0.9)' : 'rgba(28, 28, 36, 0.8)'
        }}
      >
        <span className="section-icon">{icon}</span>
        <span className="section-title" style={{ color: color }}>{title}</span>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default AccordionSection;
