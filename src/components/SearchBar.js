import React, { useState, useEffect } from "react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, onSearch]);

  return (
    <form className="search-bar" onSubmit={e => e.preventDefault()}>
      <div className="form__group field search-field">
        <input
          type="text"
          className="form__field"
          placeholder="Search entries..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="form__label">Search</label>
      </div>
    </form>
  );
}

export default SearchBar;
