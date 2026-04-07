import React, { useEffect, useState } from "react";
import { addCategory, editCategory, deleteCategory } from "../api";


function Filters({ category, setCategory, isAdmin }) {
  const [categories, setCategories] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [deletedKeys, setDeletedKeys] = useState([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [error, setError] = useState("");

  // Listen for global event to open Manage Categories from header
  useEffect(() => {
    if (!isAdmin) return;
    const handler = () => setShowManageModal(true);
    window.addEventListener('openManageCategories', handler);
    return () => window.removeEventListener('openManageCategories', handler);
  }, [isAdmin, categories]);


  const loadCategories = async () => {
    try {
      const response = await fetch("/categories.json");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
        setError("");
      } else {
        setCategories([]);
        setError("Failed to load categories");
      }
    } catch (e) {
      setCategories([]);
      setError("Failed to load categories");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // When opening modal, copy categories to pendingCategories
  useEffect(() => {
    if (showManageModal) {
      setPendingCategories(categories.filter(c => c.key !== 'all'));
      setDeletedKeys([]);
    }
  }, [showManageModal, categories]);

  // DEBUG: Log categories to help diagnose why filters may not show
  useEffect(() => {
    console.log('Loaded categories:', categories);
  }, [categories]);



  // (Unused modal logic functions removed to fix ESLint errors)

  return (
    <div className="filters" style={{ overflowX: 'auto', width: '100%', marginBottom: 8 }}>
      <div style={{ display: 'inline-flex', flexDirection: 'row', minWidth: 'fit-content', gap: 4, paddingBottom: 4 }}>
        {Array.isArray(categories) && categories.length > 0 && categories.map((c) => (
          <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
              className={`filter-btn ${category === c.key ? "active" : ""}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          </span>
        ))}
        {isAdmin && null}
      </div>
      {showManageModal && (
        <div className="modal-overlay" onClick={e => { if (e.target.classList.contains('modal-overlay')) setShowManageModal(false); }}>
          <div className="modal-content manage-categories-modal" style={{ minWidth: 340, maxWidth: 500, margin: 'auto', padding: 24, display: 'flex', flexDirection: 'column', maxHeight: 600, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop:0,marginBottom:18}}>Manage Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {pendingCategories.map((cat, idx, arr) => (
                <div key={cat.key || idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    placeholder="Key"
                    value={cat.key}
                    onChange={e => {
                      const newKey = e.target.value;
                      setPendingCategories(prev => prev.map((c, i) => i === idx ? { ...c, key: newKey } : c));
                    }}
                    style={{ flex: 2, minWidth: 0, boxSizing: 'border-box', padding: 10, fontSize: 16, borderRadius: 5, border: '1px solid #ccc' }}
                  />
                  <input
                    placeholder="Label"
                    value={cat.label}
                    onChange={e => {
                      const newLabel = e.target.value;
                      setPendingCategories(prev => prev.map((c, i) => i === idx ? { ...c, label: newLabel } : c));
                    }}
                    style={{ flex: 3, minWidth: 0, boxSizing: 'border-box', padding: 10, fontSize: 16, borderRadius: 5, border: '1px solid #ccc' }}
                  />
                  <button
                    style={{ color: '#888', background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 20, padding: 0, opacity: idx === 0 ? 0.4 : 1 }}
                    disabled={idx === 0}
                    title="Move up"
                    onClick={() => {
                      if (idx === 0) return;
                      setPendingCategories(prev => {
                        const arr = [...prev];
                        [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
                        return arr;
                      });
                    }}
                  >↑</button>
                  <button
                    style={{ color: '#888', background: 'none', border: 'none', cursor: idx === arr.length-1 ? 'not-allowed' : 'pointer', fontSize: 20, padding: 0, opacity: idx === arr.length-1 ? 0.4 : 1 }}
                    disabled={idx === arr.length-1}
                    title="Move down"
                    onClick={() => {
                      if (idx === arr.length-1) return;
                      setPendingCategories(prev => {
                        const arr = [...prev];
                        [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
                        return arr;
                      });
                    }}
                  >↓</button>
                  <button
                    style={{ color: '#b00', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, marginLeft: 2 }}
                    title="Remove"
                    onClick={() => {
                      setDeletedKeys(prev => [...prev, cat.key]);
                      setPendingCategories(prev => prev.filter((_, i) => i !== idx));
                    }}
                  >×</button>
                </div>
              ))}
            </div>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <div style={{ position: 'sticky', left: 0, bottom: 0, width: '100%', background: '#fff', padding: 0, marginTop: 'auto', zIndex: 2 }}>
              <button className="add-category-btn entry-style" style={{ width: '100%', fontWeight: 600, fontSize: 16, padding: '12px 0', background: '#e6f4fa', color: '#2596be', border: 'none', borderRadius: 6, marginBottom: 12 }}
                onClick={() => {
                  setPendingCategories(prev => [...prev, { key: '', label: '' }]);
                }}>
                + Add Category
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="save-btn entry-style" type="button" style={{ flex: 1, fontWeight: 600, fontSize: 16, padding: '12px 0' }} onClick={async () => {
                  // Validate
                  const keys = pendingCategories.map(c => c.key.trim());
                  const labels = pendingCategories.map(c => c.label.trim());
                  if (keys.includes('') || labels.includes('')) {
                    setError('All keys and labels are required.');
                    return;
                  }
                  if (new Set(keys).size !== keys.length) {
                    setError('Category keys must be unique.');
                    return;
                  }
                  // Save: upsert all, delete removed
                  for (let i = 0; i < pendingCategories.length; ++i) {
                    const cat = { ...pendingCategories[i], order: i };
                    const orig = categories.find(c => c.key === cat.key);
                    if (!orig) {
                      const res = await addCategory(cat);
                      if (res && res.error) return setError(res.error);
                    } else {
                      const res = await editCategory(cat.key, { newKey: cat.key, label: cat.label, order: cat.order });
                      if (res && res.error) return setError(res.error);
                    }
                  }
                  // Delete removed
                  for (const key of deletedKeys) {
                    if (key && categories.find(c => c.key === key)) {
                      const res = await deleteCategory(key);
                      if (res && res.error) return setError(res.error);
                    }
                  }
                  setShowManageModal(false);
                  loadCategories();
                }}>Save</button>
                <button className="cancel-btn entry-style" type="button" style={{ flex: 1, fontWeight: 600, fontSize: 16, padding: '12px 0' }} onClick={() => setShowManageModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Filters;
