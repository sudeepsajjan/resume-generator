import React from "react";
import "./DraggableSection.css";

export const DraggableSection = ({
  id,
  title,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  sectionId,
  children,
}) => {
  return (
    <section
      draggable
      id={id}
      data-section-id={sectionId}
      className={`draggable-section ${isDragging ? "dragging" : ""}`}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="section-handle">
        <span className="drag-icon">⋮⋮</span>
        <h2>{title}</h2>
      </div>
      <div className="section-content">{children}</div>
    </section>
  );
};

export default DraggableSection;
