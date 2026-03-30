import React, { useState } from "react";
import Modal from "./Modal";

function ResultsGallery({ entries, onEdit, onDelete }) {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const handleDeleteClick = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (confirmed) {
      onDelete(id);
    }
  };

  // ✅ Helper to format camelCase into spaced words
  const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="gallery">
      {entries.length === 0 && <p>No entries found.</p>}

      {entries.map((entry) => (
        <div key={entry._id} className="card">
          <div className="card-content">
            <h3>{entry.title}</h3>
            <p className="category">{formatCategory(entry.category)}</p>
          </div>

          <button className="view-btn" onClick={() => setSelectedEntry(entry)}>
            View Details
          </button>
        </div>
      ))}

      {selectedEntry && (
        <Modal onClose={() => setSelectedEntry(null)}>
          <h2>{selectedEntry.title}</h2>
          <p><strong>Category:</strong> {formatCategory(selectedEntry.category)}</p>

          <h3>Materials</h3>
          <ul>
            {selectedEntry.items.map((item, idx) => (
              <li key={idx}>
                <strong>{item.code}</strong> — {item.quantity} × {item.description}
              </li>
            ))}
          </ul>

          <div className="modal-actions">
            <button className="edit-btn" onClick={() => onEdit(selectedEntry)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDeleteClick(selectedEntry._id)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ResultsGallery;
