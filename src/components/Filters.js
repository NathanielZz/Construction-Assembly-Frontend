import React from "react";

function Filters({ category, setCategory }) {
  const categories = [
    { key: "all", label: "All" },
    { key: "singlePhase", label: "Single Phase" },
    { key: "threePhase", label: "Three Phase" },
    { key: "anchor", label: "Anchor" },
    { key: "secondary", label: "Secondary" },
  ];

  return (
    <div className="filters">
      {categories.map((c) => (
        <button
          key={c.key}
          className={`filter-btn ${category === c.key ? "active" : ""}`}
          onClick={() => setCategory(c.key)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export default Filters;
