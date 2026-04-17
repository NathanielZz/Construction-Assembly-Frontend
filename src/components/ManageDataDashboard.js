
import React, { useEffect, useState, useRef } from "react";
import MaterialsDashboard from "./MaterialsDashboard";
import ConfirmationDialog from "./ConfirmationDialog";
import AddCategoryModal from "./AddCategoryModal";

function CategoriesDashboard({ onBreadcrumb }) {
  const [categories, setCategories] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [deletedKeys, setDeletedKeys] = useState([]);
  const [showErrorDialog, setShowErrorDialog] = useState("");
  const [showConfirm, setShowConfirm] = useState({ type: null, payload: null });
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  // Pagination state (must be after pendingCategories is declared)
  const [page, setPage] = useState(1);
  const categoriesPerPage = 15;
  // Filter logic (search by name)
  const [filter, setFilter] = useState("");
  const filteredCategories = pendingCategories.filter(cat =>
    cat.key !== 'all' && (!filter || cat.key.toLowerCase().includes(filter.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  // Instead of slicing filteredCategories, keep track of the original index in pendingCategories for correct numbering
  const paginatedCategories = filteredCategories
    .map(cat => ({
      ...cat,
      originalIdx: pendingCategories.findIndex(c => c._id === cat._id)
    }))
    .slice((page - 1) * categoriesPerPage, page * categoriesPerPage);
  const nextId = useRef(1);

  const loadCategories = async () => {
    try {
      const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${BASE_URL}/categories`);
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

  // When page loads, copy categories to pendingCategories
  useEffect(() => {
    let cats = categories.map(c => ({ ...c, _id: c._id || `cat-${nextId.current++}`, hidden: c.hidden || false }));
    const allIdx = cats.findIndex(c => c.key === 'all');
    if (allIdx > 0) {
      const [allCat] = cats.splice(allIdx, 1);
      cats = [allCat, ...cats];
    }
    setPendingCategories(cats);
    setDeletedKeys([]);
  }, [categories]);

  return (
    <div className="container">
      <Breadcrumbs items={[{ label: 'Main Dashboard', onClick: onBreadcrumb.main }, { label: 'Manage Data', onClick: onBreadcrumb.data }, { label: 'Categories' }]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: 26, color: '#222', letterSpacing: 0.5 }}>Categories Dashboard</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Search for category..."
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15, minWidth: 180 }}
          />
          <button style={{ background: '#e6f4fa', color: '#2596be', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, padding: '8px 18px', cursor: 'pointer' }} onClick={() => setShowAddModal(true)}>Add Category</button>
          <AddCategoryModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            maxOrder={pendingCategories.length + 1}
            onAdd={(name, orderNum) => {
              setPendingCategories(prev => {
                const arr = [...prev];
                let idx = arr.length;
                if (typeof orderNum === 'number' && !isNaN(orderNum)) {
                  if (orderNum <= arr.length + 1) {
                    idx = orderNum - 1;
                  }
                }
                arr.splice(idx, 0, { key: name, label: name, _id: `cat-${nextId.current++}`, hidden: false });
                return arr;
              });
            }}
          />
          <button style={{ background: '#2596be', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, padding: '8px 18px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={() => setShowConfirm({ type: 'save' })}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {paginatedCategories.length === 0 ? (
          <div style={{ width: '100%', textAlign: 'center', color: '#888', padding: 32, fontSize: 18, fontWeight: 500 }}>
            No categories found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'transparent' }}>
            <thead>
              <tr style={{ background: '#f8fafb', color: '#888', fontWeight: 600, fontSize: 15 }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', width: 48 }}>#</th>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Name</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((cat, idx) => {
                // Display number always starts at 1 for visible rows
                const originalIdx = cat.originalIdx;
                return (
                  <tr key={cat._id || cat.key || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafb', transition: 'background 0.2s' }}>
                    <td style={{ padding: '8px 12px', color: '#888', fontWeight: 500 }}>{originalIdx + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        placeholder="Category name"
                        value={cat.key}
                        onChange={e => {
                          const newName = e.target.value;
                          setPendingCategories(prev => prev.map((c, i) => i === originalIdx ? { ...c, key: newName, label: newName } : c));
                        }}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 15, borderRadius: 5, border: '1px solid #e0e0e0', background: cat.hidden ? '#f5f5f5' : '#fff', color: cat.hidden ? '#aaa' : '#222', outline: 'none', transition: 'background 0.2s, color 0.2s' }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', border: 'none', background: 'transparent' }}>
                      {/* Move Up Icon */}
                      <button
                        style={{ background: 'none', border: 'none', cursor: originalIdx === 0 ? 'not-allowed' : 'pointer', opacity: originalIdx === 0 ? 0.4 : 1, padding: 0, margin: 0, height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={originalIdx === 0}
                        title="Move Up"
                        onClick={() => {
                          if (originalIdx === 0) return;
                          setPendingCategories(prev => {
                            const arr = [...prev];
                            [arr[originalIdx-1], arr[originalIdx]] = [arr[originalIdx], arr[originalIdx-1]];
                            return arr;
                          });
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      {/* Move Down Icon */}
                      <button
                        style={{ background: 'none', border: 'none', cursor: originalIdx === (pendingCategories.length-1) ? 'not-allowed' : 'pointer', opacity: originalIdx === (pendingCategories.length-1) ? 0.4 : 1, padding: 0, margin: 0, height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={originalIdx === (pendingCategories.length-1)}
                        title="Move Down"
                        onClick={() => {
                          if (originalIdx === pendingCategories.length-1) return;
                          setPendingCategories(prev => {
                            const arr = [...prev];
                            [arr[originalIdx+1], arr[originalIdx]] = [arr[originalIdx], arr[originalIdx+1]];
                            return arr;
                          });
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {/* Remove Icon */}
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0, height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Remove"
                        onClick={() => setShowConfirm({ type: 'delete', payload: { idx: originalIdx, cat } })}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                      {/* Hide/Unhide Button */}
                      <button
                        type="button"
                        style={{ background: cat.hidden ? '#fbe9e9' : '#f0f4f8', color: cat.hidden ? '#b00' : '#888', border: 'none', borderRadius: 5, fontWeight: 500, fontSize: 14, padding: '6px 12px', cursor: 'pointer', minWidth: 70, marginLeft: 8 }}
                        onClick={() => {
                          setPendingCategories(prev => prev.map((c, i) => i === originalIdx ? { ...c, hidden: !cat.hidden } : c));
                        }}
                      >
                        {cat.hidden ? 'Unhide' : 'Hide'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination controls (hide if only 1 page) */}
      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, background: '#f7fbfd', borderRadius: 12, padding: '8px 12px', boxShadow: '0 2px 8px rgba(38,202,239,0.06)', marginTop: 24 }}>
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt;</button>
          {(() => {
            const pages = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
              }
            } else {
              pages.push(1);
              if (page > 3) pages.push('ellipsis-prev');
              let start = Math.max(2, page - 1);
              let end = Math.min(totalPages - 1, page + 1);
              if (page <= 3) {
                end = 4;
              }
              if (page >= totalPages - 2) {
                start = totalPages - 3;
              }
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }
              if (page < totalPages - 2) pages.push('ellipsis-next');
              pages.push(totalPages);
            }
            return pages.map((p, idx) => {
              if (p === 'ellipsis-prev' || p === 'ellipsis-next') {
                return <span key={p + idx} style={{ minWidth: 24, textAlign: 'center', color: '#aaa', fontWeight: 700, fontSize: 18, userSelect: 'none' }}>…</span>;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={page === p ? 'active' : ''}
                  style={{ fontWeight: page === p ? 'bold' : 'normal', minWidth: 32, margin: '0 2px', borderRadius: 6 }}
                >
                  {p}
                </button>
              );
            });
          })()}
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>&gt;</button>
        </div>
      )}
      {/* Go to Top button */}
      <div style={{ margin: '18px 0 0 0', textAlign: 'center', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            background: '#2596be',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            padding: '8px 24px',
            fontSize: 15,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(38,202,239,0.10)',
            cursor: 'pointer',
            marginTop: 0
          }}
        >
          Go to Top
        </button>
      </div>
        {/* Action buttons moved to the top right of the title */}
      <ConfirmationDialog
        open={!!showErrorDialog}
        type="error"
        payload={{ message: showErrorDialog }}
        onConfirm={() => setShowErrorDialog("")}
        onCancel={() => setShowErrorDialog("")}
      />
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
            loadCategories();
            setShowConfirm({ type: null, payload: null });
          } else if (showConfirm.type === 'save') {
            setSaving(true);
            setShowConfirm({ type: null, payload: null });
            try {
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
              const catsToSave = pendingCategories
                .filter(cat => !deletedKeys.includes(cat.key))
                .map((cat, i) => ({ ...cat, order: i }));
              const res = await import('../api').then(api => api.bulkSaveCategories(catsToSave));
              if (res && res.error) { setShowErrorDialog(res.error); setSaving(false); return; }
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
  );
}

function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, idx) => (
        <span key={idx}>
          {item.onClick ? (
            <button onClick={item.onClick}>{item.label}</button>
          ) : (
            <span className="inactive">{item.label}</span>
          )}
          {idx < items.length - 1 && <span>{'>'}</span>}
        </span>
      ))}
    </nav>
  );
}

function ManageDataDashboard({ onBack }) {
  const [section, setSection] = useState(null);

  // Only gray and not clickable in Manage Data view
  const breadcrumbs = [
    { label: 'Main Dashboard', onClick: onBack },
    section == null
      ? { label: 'Manage Data' }
      : { label: 'Manage Data', onClick: () => setSection(null) }
  ];

  if (section === "materials") {
    return (
      <div className="container">
        <Breadcrumbs items={[...breadcrumbs, { label: 'Materials' }]} />
        <MaterialsDashboard />
      </div>
    );
  }
  if (section === "categories") {
    return <CategoriesDashboard onBreadcrumb={{ main: onBack, data: () => setSection(null) }} />;
  }

  return (
    <div className="container">
      <Breadcrumbs items={breadcrumbs} />
      <h2 style={{ marginTop: 0 }}>Manage Data</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
        <button className="manage-categories-btn" style={{ padding: 16, fontSize: 18 }} onClick={() => setSection("categories")}>Manage Categories</button>
        <button className="manage-materials-btn" style={{ padding: 16, fontSize: 18 }} onClick={() => setSection("materials")}>Manage Materials</button>
      </div>
    </div>
  );
}

export default ManageDataDashboard;
