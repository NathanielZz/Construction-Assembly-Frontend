import React, { useEffect, useState, useRef, useCallback } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import { getMaterials, addMaterial, editMaterial, deleteMaterial } from "../materialsApi";

function MaterialsDashboard() {
  // State declarations must come first
  const [materials, setMaterials] = useState([]);
  const [page, setPage] = useState(1);
  const materialsPerPage = 15;
  // Filter logic (search by title)
  const [filter, setFilter] = useState("");
  // Only show materials with a valid name, just like categories
  const filteredMaterials = materials
    .filter(mat => mat && typeof mat.name === 'string' && mat.name.trim() !== '')
    .filter(mat => !filter || mat.name.toLowerCase().includes(filter.toLowerCase()));
  const totalPages = Math.ceil(filteredMaterials.length / materialsPerPage);
  const paginatedMaterials = filteredMaterials.slice((page - 1) * materialsPerPage, page * materialsPerPage);

  // Fetch real materials from backend
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const data = await getMaterials();
        if (Array.isArray(data)) {
          setMaterials(data);
        } else {
          setMaterials([]);
        }
      } catch (err) {
        setMaterials([]);
      }
    }
    fetchMaterials();
  }, []);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const modalRef = useRef();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'add' or 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEdit(mat) {
    setEditing(mat);
    setForm({ name: mat.name });
    setShowForm(true);
  }

  // Track initial value for dirty check
  const initialValue = editing ? editing.name : "";
  const isDirty = form.name !== initialValue;

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      doCancel();
    }
  }, [isDirty]);

  function doCancel() {
    setEditing(null);
    setForm({ name: "" });
    setError("");
    setShowForm(false);
    setShowCancelConfirm(false);
  }

  const [deleteIdx, setDeleteIdx] = useState(null);
  function handleDelete(name) {
    // Find the material object by name
    const mat = materials.find(m => m.name === name);
    setDeleteIdx(mat);
  }
  async function confirmDelete() {
    if (!deleteIdx) return;
    try {
      await deleteMaterial(deleteIdx._id);
      setMaterials(materials => materials.filter(m => m._id !== deleteIdx._id));
    } catch (err) {
      // Optionally show error
    }
    setDeleteIdx(null);
  }
  function cancelDelete() {
    setDeleteIdx(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!editing && materials.some(m => m.name.toLowerCase() === form.name.trim().toLowerCase())) {
      setError("Name already exists.");
      return;
    }
    setPendingAction(editing ? 'edit' : 'add');
    setShowConfirm(true);
  }

  async function doSaveMaterial() {
    try {
      if (pendingAction === 'add') {
        const newMat = await addMaterial(form.name.trim());
        if (newMat && newMat._id) {
          setMaterials(materials => [...materials, newMat]);
          setEditing(null);
          setForm({ name: "" });
          setError("");
          setShowForm(false);
          setShowCancelConfirm(false);
          setShowConfirm(false);
          setPendingAction(null);
        } else if (newMat && newMat.error) {
          setError(newMat.error);
        } else {
          setError("Failed to save material");
        }
      } else if (pendingAction === 'edit' && editing) {
        const updated = await editMaterial(editing._id, form.name.trim());
        if (updated && updated._id) {
          setMaterials(materials => materials.map(m => m._id === updated._id ? updated : m));
          setEditing(null);
          setForm({ name: "" });
          setError("");
          setShowForm(false);
          setShowCancelConfirm(false);
          setShowConfirm(false);
          setPendingAction(null);
        } else if (updated && updated.error) {
          setError(updated.error);
        } else {
          setError("Failed to update material");
        }
      }
    } catch (err) {
      setError(err?.message || "Failed to save material");
    }
  }

  // ESC key closes modal with same logic as clicking outside
  useEffect(() => {
    if (!showForm) return;
    function onKeyDown(e) {
      if (e.key === "Escape") handleCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showForm, handleCancel]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Materials Dashboard</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Search for material..."
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15, minWidth: 180 }}
          />
          <button className="register-btn" style={{ padding: '6px 16px', fontSize: 15 }} onClick={() => { setDeleteIdx(null); setShowForm(true); setEditing(null); setForm({ name: "" }); }}>Add Material</button>
        </div>
      </div>
      {showForm && (
        <div
          className="modal-overlay"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}
          onClick={e => {
            if (e.target.classList.contains('modal-overlay')) handleCancel();
          }}
        >
          <div
            className="modal"
            ref={modalRef}
            style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #38caef44', padding: 32, minWidth: 340, maxWidth: 400, position: 'relative', border: '1.5px solid #38caef', overflow: 'visible' }}
            tabIndex={-1}
          >
            <h3 style={{ marginTop: 0, marginBottom: 18, color: '#2596be', fontWeight: 600, letterSpacing: 0.5 }}>{editing ? 'Edit Material' : 'Add Material'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Material Name"
                style={{
                  width: '100%',
                  marginBottom: 16,
                  padding: '12px 14px',
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1.5px solid #38caef',
                  outline: 'none',
                  background: '#f8fafd',
                  boxSizing: 'border-box',
                  fontWeight: 500
                }}
                autoFocus
              />
              {error && (
                <div style={{ color: '#d00', background: '#fff0f0', padding: '10px', borderRadius: 4, marginBottom: 12, fontWeight: 500 }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="logout-btn" style={{ padding: '8px 18px', borderRadius: 6, fontWeight: 500 }} onClick={handleCancel}>Cancel</button>
                <button type="submit" className="register-btn" style={{ padding: '8px 18px', borderRadius: 6, fontWeight: 500 }}>{editing ? "Update" : "Add"}</button>
              </div>
            </form>
            <ConfirmationDialog
              open={showConfirm}
              type={pendingAction === 'edit' ? 'save' : 'add'}
              payload={{ message: pendingAction === 'edit'
                ? 'Are you sure you want to update this material?'
                : 'Are you sure you want to add this material?' }}
              onConfirm={doSaveMaterial}
              onCancel={() => { setShowConfirm(false); setPendingAction(null); }}
            />
            <ConfirmationDialog
              open={showCancelConfirm}
              type="cancel"
              payload={{ message: "Are you sure you want to cancel? Unsaved changes will be lost." }}
              onConfirm={doCancel}
              onCancel={() => setShowCancelConfirm(false)}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation dialog only when not in modal */}
      {!showForm && !!deleteIdx && (
        <ConfirmationDialog
          open={!!deleteIdx}
          type="delete"
          payload={{ cat: { label: 'this material' } }}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {paginatedMaterials.length === 0 ? (
          <div style={{ width: '100%', textAlign: 'center', color: '#888', padding: 32, fontSize: 18, fontWeight: 500 }}>
            No materials found
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
              {paginatedMaterials.map((mat, idx) => (
                <tr key={mat.name || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafb', transition: 'background 0.2s' }}>
                  <td style={{ padding: '8px 12px', color: '#bbb', fontWeight: 500 }}>{(page - 1) * materialsPerPage + idx + 1}</td>
                  <td style={{ padding: '8px 12px' }}>{mat.name}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', border: 'none', background: 'transparent' }}>
                    <button className="manage-categories-btn" onClick={() => handleEdit(mat)}>Edit</button>
                    <button className="logout-btn" onClick={() => handleDelete(mat.name)} style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination controls */}
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
    </div>
  );
}

export default MaterialsDashboard;
