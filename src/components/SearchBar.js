import React, { useState } from "react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
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
      <button type="submit" className="search-btn">Search</button>
    </form>
  );
}

export default SearchBar;
