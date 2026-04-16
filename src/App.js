import React, { useState, useEffect, useCallback } from "react";
import ConfirmationDialog from "./components/ConfirmationDialog";
import { getEntries, searchEntries, addEntry, updateEntry, deleteEntry } from "./api";
import SearchBar from "./components/SearchBar";
import Filters from "./components/Filters";
import ResultsGallery from "./components/ResultsGallery"; // ✅ using gallery view
import EntryForm from "./components/EntryForm";
import ManageDataDashboard from "./components/ManageDataDashboard";
import Login from "./login";
import "./styles.css";


function App() {
  // Confirmation dialog state (must be inside component)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [dialogPayload, setDialogPayload] = useState(null);
  const [dialogCallback, setDialogCallback] = useState(null);

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
  const [showManageData, setShowManageData] = useState(false); // Show manage data dashboard

  const ENTRIES_PER_PAGE = 15;

  const loadEntries = useCallback(async (cat = category, showH = showHidden) => {
    try {
      const data = await getEntries(cat, isAuthenticated, showH);
      if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
        if (data && data.error && isAuthenticated) {
          setDialogType("error");
          setDialogPayload({ message: data.error || "Failed to load entries." });
          setDialogOpen(true);
        }
      }
    } catch (err) {
      setEntries([]);
      if (isAuthenticated) {
        setDialogType("error");
        setDialogPayload({ message: "Error loading entries: " + err.message });
        setDialogOpen(true);
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

  const handleSearch = useCallback(async (searchObj) => {
    // searchObj: { query, filter }
    if (!searchObj || !searchObj.query) {
      loadEntries();
      setPage(1);
    } else {
      try {
        // Pass filter and query to backend search
        const data = await searchEntries(searchObj.query, searchObj.filter);
        if (Array.isArray(data)) {
          setEntries(data);
        } else {
          setEntries([]);
        }
        setPage(1);
      } catch (err) {
        setEntries([]);
        setPage(1);
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
    // Only save, no confirmation here. Confirmation handled in EntryForm.
    if (editingEntry) {
      const updated = await updateEntry(editingEntry._id, entryData);
      await loadEntries();
      setEditingEntry(updated);
      setSelectedEntry(updated);
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

  if (showManageData) {
    return <ManageDataDashboard onBack={() => setShowManageData(false)} />;
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
              <button className="manage-data-btn" style={{ marginRight: 2, padding: '6px 10px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => setShowManageData(true)}>
                Manage Data
              </button>
            </>
          )}
          {isAuthenticated ? (
            <>
              <button className="logout-btn" style={{ padding: '6px 10px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => {
                setDialogType("cancel");
                setDialogPayload({ message: "Are you sure you want to log out?" });
                setDialogCallback(() => () => {
                  sessionStorage.removeItem("token");
                  setIsAuthenticated(false);
                });
                setDialogOpen(true);
              }}>Logout</button>
                    <ConfirmationDialog
                      open={dialogOpen}
                      type={dialogType}
                      payload={dialogPayload}
                      onConfirm={() => {
                        setDialogOpen(false);
                        if (typeof dialogCallback === 'function') {
                          dialogCallback();
                          setDialogCallback(null);
                        }
                      }}
                      onCancel={() => {
                        setDialogOpen(false);
                        setDialogCallback(null);
                      }}
                    />
              <button
                style={{ background: 'none', border: 'none', padding: '6px', marginLeft: 2, cursor: 'pointer', fontSize: 22, color: '#2596be', display: 'flex', alignItems: 'center' }}
                title="Refresh entries"
                onClick={() => { loadEntries(); setPage(1); }}
              >
                <span role="img" aria-label="refresh">&#x21bb;</span>
              </button>
            </>
          ) : (
            <>
              <button className="register-btn" style={{ padding: '6px 10px', fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => setShowLogin(true)}>Login</button>
              <button
                style={{ background: 'none', border: 'none', padding: '6px', marginLeft: 2, cursor: 'pointer', fontSize: 22, color: '#2596be', display: 'flex', alignItems: 'center' }}
                title="Refresh entries"
                onClick={() => { loadEntries(); setPage(1); }}
              >
                <span role="img" aria-label="refresh">&#x21bb;</span>
              </button>
            </>
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
          requireSaveConfirm={!!editingEntry}
        />
      )}
    </div>
  );
}

export default App;
