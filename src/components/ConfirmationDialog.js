import React from "react";

function ConfirmationDialog({ open, type, payload, onConfirm, onCancel }) {
  if (!open) return null;
  let message = "Are you sure?";
  let showCancel = true;
  let confirmLabel = 'Confirm';
  let confirmColor = '#2596be';

  // Custom message override
  if (payload?.message) {
    message = payload.message;
  } else if (type === "delete") {
    message = (
      <>
        Are you sure you want to delete <b>{payload?.cat?.label || payload?.cat?.key || 'this item'}</b>?
      </>
    );
    confirmLabel = 'Delete';
    confirmColor = '#b00';
  } else if (type === "cancel") {
    message = "Are you sure you want to discard your changes?";
    confirmLabel = 'Discard';
    confirmColor = '#b00';
  } else if (type === "save") {
    message = "Are you sure you want to save these changes?";
    confirmLabel = 'Save';
    confirmColor = '#2596be';
  } else if (type === "error") {
    message = payload?.message || 'An error occurred.';
    confirmLabel = 'OK';
    confirmColor = '#b00';
    showCancel = false;
  }

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 280, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
        <div style={{ marginBottom: 18, color: type === 'error' ? '#b00' : undefined, fontWeight: type === 'error' ? 600 : undefined }}>{message}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onConfirm} style={{ background: confirmColor, color: '#fff', border: 'none', borderRadius: 5, padding: '8px 18px', fontWeight: 600 }}>
            {confirmLabel}
          </button>
          {showCancel && (
            <button onClick={onCancel} style={{ background: '#eee', color: '#444', border: 'none', borderRadius: 5, padding: '8px 18px', fontWeight: 600 }}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
