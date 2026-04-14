import React, { useState } from "react";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "title", label: "Title" },
  { value: "code", label: "Item Code" },
  { value: "description", label: "Item Description" },
];


function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ query, filter });
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="form__group field search-field" style={{ margin: 0 }}>
        <input
          type="text"
          className="form__field"
          placeholder={`Search by ${FILTER_OPTIONS.find(f => f.value === filter)?.label || 'Title'}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 180 }}
        />
        <label className="form__label">Search</label>
      </div>
      <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
        {FILTER_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button type="submit" style={{ padding: '7px 16px', borderRadius: 6, background: '#2596be', color: '#fff', fontWeight: 600, border: 'none', fontSize: 15, cursor: 'pointer' }}>Search</button>
    </form>
  );
}

export default SearchBar;
