// src/script.js
// Utility functions for frontend

export function validateEntry(entry) {
  if (!entry.category || !entry.title) {
    return "Category and Title are required.";
  }
  return null;
}

export function formatQuantity(qty) {
  return qty ? `${qty}` : "-";
}
