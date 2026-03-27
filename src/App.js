import React, { useState, useEffect, useCallback } from "react";
import { getEntries, searchEntries, addEntry, updateEntry, deleteEntry } from "./api";
import SearchBar from "./components/SearchBar";
import Filters from "./components/Filters";
import ResultsTable from "./components/ResultsTable";
import EntryForm from "./components/EntryForm";
import "./styles.css";

function App() {
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const loadEntries = useCallback(async () => {
    const data = await getEntries(category);
    setEntries(data);
  }, [category]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleSearch(query) {
    if (!query) {
      loadEntries();
    } else {
      const data = await searchEntries(query);
      setEntries(data);
    }
  }

  async function handleDelete(id) {
    await deleteEntry(id);
    loadEntries();
  }

  async function handleSave(entryData) {
    if (editingEntry) {
      await updateEntry(editingEntry._id, entryData);
    } else {
      await addEntry(entryData);
    }
    setShowModal(false);
    setEditingEntry(null);
    loadEntries();
  }

  return (
    <div className="container">
      <h1>Construction Assembly Logger</h1>
      <p className="subtitle">Logging System for Construction Assembly Materials</p>

      <SearchBar onSearch={handleSearch} />

      <div className="top-actions">
        <Filters category={category} setCategory={setCategory} />
        <button className="register-btn" onClick={() => setShowModal(true)}>
          Register New Entry
        </button>
      </div>

      <ResultsTable
        entries={entries}
        onEdit={(entry) => {
          setEditingEntry(entry);
          setShowModal(true);
        }}
        onDelete={handleDelete}
      />

      {showModal && (
        <EntryForm
          entry={editingEntry}
          onClose={() => {
            setShowModal(false);
            setEditingEntry(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default App;