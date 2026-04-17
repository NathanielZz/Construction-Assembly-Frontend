import React, { useState } from "react";
import Modal from "./Modal";

function AddCategoryModal({ open, onClose, onAdd, maxOrder }) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    let orderNum = parseInt(order, 10);
    if (order && (isNaN(orderNum) || orderNum < 1 || orderNum > maxOrder)) {
      setError(`Order must be between 1 and ${maxOrder}`);
      return;
    }
    onAdd(name.trim(), orderNum || maxOrder);
    setName("");
    setOrder("");
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ minWidth: 380, maxWidth: 700, width: '100%', padding: 24, overflow: 'hidden', boxSizing: 'border-box' }}>
        <h3 style={{ marginTop: 0, marginBottom: 18, color: '#2596be', fontWeight: 600, letterSpacing: 0.5 }}>Add Category</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 8, width: '100%' }}>
          <input
            type="number"
            min={1}
            max={maxOrder}
            value={order}
            onChange={e => setOrder(e.target.value)}
            placeholder={`Order (1 - ${maxOrder})`}
            style={{ width: 170, minWidth: 0, padding: '12px 14px', fontSize: 16, borderRadius: 8, border: '1px solid #e0e0e0', boxSizing: 'border-box' }}
          />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Category Name"
            style={{ flex: 1, minWidth: 0, padding: '12px 14px', fontSize: 16, borderRadius: 8, border: '1px solid #e0e0e0', boxSizing: 'border-box' }}
          />
        </div>
        {error && <div style={{ color: '#d00', margin: '12px 0' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#eee', color: '#333', fontWeight: 500 }}>Cancel</button>
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2596be', color: '#fff', fontWeight: 600 }}>Add</button>
        </div>
      </form>
    </Modal>
  );
}

export default AddCategoryModal;
