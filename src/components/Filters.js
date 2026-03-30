import React from "react";

function Filters({ category, setCategory }) {
  const categories = [
    { key: "all", label: "All" },
    { key: "Single Phase", label: "Single Phase" },
    { key: "Three Phase", label: "Three Phase" },
    { key: "Anchor", label: "Anchor" },
    { key: "Secondary", label: "Secondary" },
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
