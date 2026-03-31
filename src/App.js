import React, { useState, useEffect, useCallback } from "react";
import { getEntries, searchEntries, addEntry, updateEntry, deleteEntry } from "./api";
import SearchBar from "./components/SearchBar";
import Filters from "./components/Filters";
import ResultsGallery from "./components/ResultsGallery"; // ✅ using gallery view
import EntryForm from "./components/EntryForm";
import Login from "./login";
import "./styles.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem("token")
  );
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null); // For gallery modal
  const [showEdit, setShowEdit] = useState(false); // For gallery edit mode
  const [page, setPage] = useState(1); // Pagination: current page

  const ENTRIES_PER_PAGE = 15;

  const loadEntries = useCallback(async (cat = category) => {
    try {
      const data = await getEntries(cat);
      if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
        alert(data.error || "Failed to load entries.");
      }
    } catch (err) {
      setEntries([]);
      alert("Error loading entries: " + err.message);
    }
  }, [category]);

  useEffect(() => {
    if (isAuthenticated) loadEntries();
  }, [isAuthenticated, loadEntries]);

  // Reload entries when filter changes
  useEffect(() => {
    if (isAuthenticated) {
      loadEntries(category);
      setPage(1); // Reset to first page on filter change
    }
    // eslint-disable-next-line
  }, [category]);

  const handleSearch = useCallback(async (query) => {
    if (!query) {
      loadEntries();
      setPage(1);
    } else {
      try {
        const data = await searchEntries(query);
        if (Array.isArray(data)) {
          setEntries(data);
        } else {
          setEntries([]);
          // Optionally show alert: alert(data.error || "No results found.");
        }
        setPage(1);
      } catch (err) {
        setEntries([]);
        setPage(1);
        // Optionally show alert: alert("Error searching entries: " + err.message);
      }
    }
  }, [loadEntries]);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  async function handleDelete(id) {
    await deleteEntry(id);
    loadEntries();
  }


  async function handleSave(entryData) {
    // Confirm before saving edits
    if (editingEntry) {
      const confirmed = window.confirm("Are you sure you want to save these edits?");
      if (!confirmed) return;
      const updated = await updateEntry(editingEntry._id, entryData);
      // Update entries list and selected entry for modal
      await loadEntries();
      setEditingEntry(updated);
      setSelectedEntry(updated); // Update modal with new data
      setShowModal(false);
      setEditingEntry(null);
      setShowEdit(false);
    } else {
      await addEntry(entryData);
      setShowModal(false);
      setEditingEntry(null);
      loadEntries();
    }
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

      <ResultsGallery
        entries={entries}
        onEdit={(entry) => {
          setEditingEntry(entry);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        selectedEntry={selectedEntry}
        setSelectedEntry={setSelectedEntry}
        showEdit={showEdit}
        setShowEdit={setShowEdit}
        page={page}
        setPage={setPage}
        entriesPerPage={ENTRIES_PER_PAGE}
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
