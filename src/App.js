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
  const [showHidden, setShowHidden] = useState(false); // Show hidden cards toggle

  const ENTRIES_PER_PAGE = 15;


  const loadEntries = useCallback(async (cat = category, showH = showHidden) => {
    try {
      const data = await getEntries(cat, isAuthenticated, showH);
      if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
        if (data && data.error && isAuthenticated) {
          alert(data.error || "Failed to load entries.");
        }
      }
    } catch (err) {
      setEntries([]);
      if (isAuthenticated) {
        alert("Error loading entries: " + err.message);
      }
    }
  }, [category, isAuthenticated, showHidden]);


  useEffect(() => {
    loadEntries();
  }, [isAuthenticated, loadEntries]);

  // Reload entries when category changes

  useEffect(() => {
    loadEntries(category, showHidden);
    setPage(1); // Reset to first page on filter change
    // eslint-disable-next-line
  }, [category, showHidden]);

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


  // Show login modal if requested
  const [showLogin, setShowLogin] = useState(false);

  // Show gallery for all users, admin controls only if authenticated

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


  // Only show login page if login modal is open and not authenticated
  if (showLogin && !isAuthenticated) {
    return (
      <Login 
        onLogin={() => { setIsAuthenticated(true); setShowLogin(false); }}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  return (
    <div className="container">


      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16, flexWrap: 'nowrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 28, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>Construction Assembly Logger</h1>
          <p className="subtitle" style={{ margin: 0, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Logging System for Construction Assembly Materials</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isAuthenticated && (
            <>
              <button className="register-btn" style={{ marginRight: 2, padding: '6px 10px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => setShowModal(true)}>
                Register New Entry
              </button>
              <button className="manage-categories-btn" style={{ marginRight: 2, padding: '6px 10px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => {
                const evt = new CustomEvent('openManageCategories');
                window.dispatchEvent(evt);
              }}>
                Manage Categories
              </button>
            </>
          )}
          {isAuthenticated ? (
            <button className="logout-btn" style={{ padding: '6px 10px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                sessionStorage.removeItem("token");
                setIsAuthenticated(false);
              }
            }}>Logout</button>
          ) : (
            <button className="register-btn" style={{ padding: '6px 10px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => setShowLogin(true)}>Login</button>
          )}
        </div>
      </div>

      <SearchBar onSearch={handleSearch} />

      <div className="top-actions">
        <Filters category={category} setCategory={setCategory} isAdmin={isAuthenticated} />
      </div>


      <ResultsGallery
        entries={entries}
        onEdit={isAuthenticated ? (entry => { setEditingEntry(entry); setShowModal(true); }) : undefined}
        onDelete={isAuthenticated ? handleDelete : undefined}
        selectedEntry={selectedEntry}
        setSelectedEntry={setSelectedEntry}
        showEdit={showEdit}
        setShowEdit={setShowEdit}
        page={page}
        setPage={setPage}
        entriesPerPage={ENTRIES_PER_PAGE}
        isAuthenticated={isAuthenticated}
        showHidden={showHidden}
        setShowHidden={setShowHidden}
        reloadEntries={() => loadEntries(category, showHidden)}
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
