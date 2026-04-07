import React from "react";

function ConfirmationDialog({ open, type, payload, onConfirm, onCancel }) {
  if (!open) return null;
  let message = "Are you sure?";
  if (type === "delete") {
    message = (
      <>
        Are you sure you want to delete category <b>{payload?.cat?.label || payload?.cat?.key}</b>?
      </>
    );
  } else if (type === "cancel") {
    message = "Are you sure you want to cancel and discard changes?";
  } else if (type === "save") {
    message = "Are you sure you want to save changes to categories?";
  }
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 280, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
        <div style={{ marginBottom: 18 }}>{message}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onConfirm} style={{ background: type === 'delete' || type === 'cancel' ? '#b00' : '#2596be', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 18px', fontWeight: 600 }}>
            {type === 'delete' ? 'Delete' : type === 'cancel' ? 'Yes, Discard' : 'Yes, Save'}
          </button>
          <button onClick={onCancel} style={{ background: '#eee', color: '#444', border: 'none', borderRadius: 5, padding: '8px 18px', fontWeight: 600 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
