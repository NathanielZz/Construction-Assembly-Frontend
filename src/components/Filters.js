import React, { useEffect, useState, useRef } from "react";
import ConfirmationDialog from "./ConfirmationDialog";


function Filters({ category, setCategory, isAdmin }) {
  const [saving, setSaving] = useState(false);
  // For generating unique ids for new categories
  const nextId = useRef(1);
  const [categories, setCategories] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [initialPending, setInitialPending] = useState([]); // for dirty check
  const [deletedKeys, setDeletedKeys] = useState([]);
  const [showManageModal, setShowManageModal] = useState(false);
  // const [error, setError] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState("");
  const [showConfirm, setShowConfirm] = useState({ type: null, payload: null });

  // Listen for global event to open Manage Categories from header
  useEffect(() => {
    if (!isAdmin) return;
    const handler = () => setShowManageModal(true);
    window.addEventListener('openManageCategories', handler);
    return () => window.removeEventListener('openManageCategories', handler);
  }, [isAdmin, categories]);



  const loadCategories = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_CATEGORY_API_URL || "/categories");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
        setShowErrorDialog("Failed to load categories");
      }
    } catch (e) {
      setCategories([]);
      setShowErrorDialog("Failed to load categories");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // When opening modal, copy categories to pendingCategories
  useEffect(() => {
    if (showManageModal) {
      // Always put 'All' category first and make it fixed
      let cats = categories.map(c => ({ ...c, _id: c._id || `cat-${nextId.current++}` }));
      const allIdx = cats.findIndex(c => c.key === 'all');
      if (allIdx > 0) {
        const [allCat] = cats.splice(allIdx, 1);
        cats = [allCat, ...cats];
      }
      setPendingCategories(cats);
      setInitialPending(JSON.stringify(cats));
      setDeletedKeys([]);
    }
  }, [showManageModal, categories]);

  return (
    <div className="filters" style={{ overflowX: 'auto', width: '100%', marginBottom: 8 }}>
      <div style={{ display: 'inline-flex', flexDirection: 'row', minWidth: 'fit-content', gap: 4, paddingBottom: 4 }}>
        {Array.isArray(categories) && categories.length > 0 && (() => {
          // Always render 'All' category first
          let filtered = categories.filter(c => !c.hidden);
          const allIdx = filtered.findIndex(c => c.key === 'all');
          let ordered = filtered;
          if (allIdx > 0) {
            const allCat = filtered[allIdx];
            ordered = [allCat, ...filtered.slice(0, allIdx), ...filtered.slice(allIdx + 1)];
          }
          return ordered.map((c) => (
            <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                className={`filter-btn ${category === c.key ? "active" : ""}`}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            </span>
          ));
        })()}
        {isAdmin && null}
      </div>
      {showManageModal && (
        <div
          className="modal-overlay"
          tabIndex={0}
          onClick={e => {
            if (e.target.classList.contains('modal-overlay')) {
              // Check for unsaved changes
              if (JSON.stringify(pendingCategories) !== initialPending) {
                setShowConfirm({ type: 'cancel' });
              } else {
                setShowManageModal(false);
              }
            }
          }}
        >
          <div
            className="modal-content manage-categories-modal"
            style={{ minWidth: 340, maxWidth: 500, margin: 'auto', padding: 24, display: 'flex', flexDirection: 'column', maxHeight: 600, position: 'relative' }}
            onClick={e => e.stopPropagation()}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                if (JSON.stringify(pendingCategories) !== initialPending) {
                  setShowConfirm({ type: 'cancel' });
                } else {
                  setShowManageModal(false);
                }
              }
            }}
          >
            <h3 style={{marginTop:0,marginBottom:18}}>Manage Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 320, overflowY: 'auto' }}>
              {pendingCategories.filter(cat => cat.key !== 'all').map((cat, idx, arr) => {
                // Find the real index in pendingCategories
                const realIdx = pendingCategories.findIndex(c => c._id === cat._id);
                return (
                  <div key={cat._id || cat.key || idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      placeholder="Key"
                      value={cat.key}
                      onChange={e => {
                        const newKey = e.target.value;
                        setPendingCategories(prev => prev.map((c, i) => i === realIdx ? { ...c, key: newKey } : c));
                      }}
                      style={{ flex: 2, minWidth: 0, boxSizing: 'border-box', padding: 10, fontSize: 16, borderRadius: 5, border: '1px solid #ccc' }}
                    />
                    <input
                      placeholder="Label"
                      value={cat.label}
                      onChange={e => {
                        const newLabel = e.target.value;
                        setPendingCategories(prev => prev.map((c, i) => i === realIdx ? { ...c, label: newLabel } : c));
                      }}
                      style={{ flex: 3, minWidth: 0, boxSizing: 'border-box', padding: 10, fontSize: 16, borderRadius: 5, border: '1px solid #ccc' }}
                    />
                    <button
                      type="button"
                      title={cat.hidden ? "Unhide category" : "Hide category"}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 4, fontSize: 20, color: cat.hidden ? '#b00' : '#888', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px' }}
                      onClick={() => {
                        setPendingCategories(prev => prev.map((c, i) => i === realIdx ? { ...c, hidden: !cat.hidden } : c));
                      }}
                    >
                      {cat.hidden ? (
                        // Eye-off icon
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 2.06-3.06"/><path d="M1 1l22 22"/><path d="M1 12s4-7 11-7c2.5 0 4.71.66 6.63 1.76"/><path d="M12 12a3 3 0 0 1-3-3"/></svg>
                      ) : (
                        // Eye icon
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                    <button
                      style={{ color: '#888', background: 'none', border: 'none', cursor: realIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 20, padding: 0, opacity: realIdx === 0 ? 0.4 : 1 }}
                      disabled={realIdx === 0}
                      title="Move up"
                      onClick={() => {
                        if (realIdx === 0) return;
                        setPendingCategories(prev => {
                          const arr = [...prev];
                          [arr[realIdx-1], arr[realIdx]] = [arr[realIdx], arr[realIdx-1]];
                          return arr;
                        });
                      }}
                    >↑</button>
                    <button
                      style={{ color: '#888', background: 'none', border: 'none', cursor: realIdx === pendingCategories.length-1 ? 'not-allowed' : 'pointer', fontSize: 20, padding: 0, opacity: realIdx === pendingCategories.length-1 ? 0.4 : 1 }}
                      disabled={realIdx === pendingCategories.length-1}
                      title="Move down"
                      onClick={() => {
                        if (realIdx === pendingCategories.length-1) return;
                        setPendingCategories(prev => {
                          const arr = [...prev];
                          [arr[realIdx+1], arr[realIdx]] = [arr[realIdx], arr[realIdx+1]];
                          return arr;
                        });
                      }}
                    >↓</button>
                    <button
                      style={{ color: '#b00', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, marginLeft: 2 }}
                      title="Remove"
                      onClick={() => {
                        setShowConfirm({ type: 'delete', payload: { idx: realIdx, cat } });
                      }}
                    >×</button>
                  </div>
                );
              })}
            </div>
            {/* Error dialog popup for consistency */}
            <ConfirmationDialog
              open={!!showErrorDialog}
              type="error"
              payload={{ message: showErrorDialog }}
              onConfirm={() => setShowErrorDialog("")}
              onCancel={() => setShowErrorDialog("")}
            />
            <div style={{ position: 'sticky', left: 0, bottom: 0, width: '100%', background: '#fff', padding: 0, marginTop: 'auto', zIndex: 2 }}>
              <button className="add-category-btn entry-style" style={{ width: '100%', fontWeight: 600, fontSize: 16, padding: '12px 0', background: '#e6f4fa', color: '#2596be', border: 'none', borderRadius: 6, marginBottom: 12 }}
                onClick={() => {
                  setPendingCategories(prev => [
                    ...prev,
                    { key: '', label: '', _id: `cat-${nextId.current++}` }
                  ]);
                }}>
                + Add Category
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="save-btn entry-style"
                  type="button"
                  style={{ flex: 1, fontWeight: 600, fontSize: 16, padding: '12px 0', opacity: saving ? 0.7 : 1, position: 'relative' }}
                  disabled={saving}
                  onClick={() => setShowConfirm({ type: 'save' })}
                >
                  {saving && (
                    <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 50 50" style={{ verticalAlign: 'middle' }}>
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#2596be" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                      </svg>
                    </span>
                  )}
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="cancel-btn entry-style"
                  type="button"
                  style={{ flex: 1, fontWeight: 600, fontSize: 16, padding: '12px 0', background: '#eee', color: '#444', border: 'none', borderRadius: 6 }}
                  onClick={() => {
                    if (JSON.stringify(pendingCategories) !== initialPending) {
                      setShowConfirm({ type: 'cancel' });
                    } else {
                      setShowManageModal(false);
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
            <ConfirmationDialog
              open={!!showConfirm.type}
              type={showConfirm.type}
              payload={showConfirm.payload}
              onConfirm={async () => {
                if (showConfirm.type === 'delete') {
                  setDeletedKeys(prev => [...prev, showConfirm.payload.cat.key]);
                  setPendingCategories(prev => prev.filter((_, i) => i !== showConfirm.payload.idx));
                  setShowConfirm({ type: null, payload: null });
                } else if (showConfirm.type === 'cancel') {
                  setShowManageModal(false);
                  setShowConfirm({ type: null, payload: null });
                } else if (showConfirm.type === 'save') {
                  setSaving(true);
                  setShowConfirm({ type: null, payload: null });
                  try {
                    // Validate
                    const keys = pendingCategories.map(c => c.key.trim());
                    const labels = pendingCategories.map(c => c.label.trim());
                    if (keys.includes('') || labels.includes('')) {
                      setShowErrorDialog('All keys and labels are required.');
                      setSaving(false);
                      return;
                    }
                    if (new Set(keys).size !== keys.length) {
                      setShowErrorDialog('Category keys must be unique.');
                      setSaving(false);
                      return;
                    }
                    // Bulk save all categories (excluding deleted)
                    const catsToSave = pendingCategories
                      .filter(cat => !deletedKeys.includes(cat.key))
                      .map((cat, i) => ({ ...cat, order: i }));
                    const res = await import('../api').then(api => api.bulkSaveCategories(catsToSave));
                    if (res && res.error) { setShowErrorDialog(res.error); setSaving(false); return; }
                    setShowManageModal(false);
                    loadCategories();
                  } catch (err) {
                    setShowErrorDialog(err.message || 'Failed to save categories.');
                  } finally {
                    setSaving(false);
                  }
                }
              }}
              onCancel={() => setShowConfirm({ type: null, payload: null })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Filters;
