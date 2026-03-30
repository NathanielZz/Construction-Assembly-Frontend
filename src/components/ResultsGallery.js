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

  return (
    <div className="gallery">
      {entries.length === 0 && <p>No entries found.</p>}

      {entries.map((entry) => (
        <div key={entry._id} className="card">
          {/* Image display */}
          {entry.image ? (
            <img src={entry.image} alt={entry.title} className="card-image" />
          ) : (
            <div className="card-image placeholder">No Image</div>
          )}

          <div className="card-content">
            <h3>{entry.title}</h3>
            <p className="category">{entry.category}</p>
          </div>

          <button className="view-btn" onClick={() => setSelectedEntry(entry)}>
            View Details
          </button>
        </div>
      ))}

      {/* Modal for details */}
      {selectedEntry && (
        <Modal onClose={() => setSelectedEntry(null)}>
          <h2>{selectedEntry.title}</h2>

          {selectedEntry.image ? (
            <img
              src={selectedEntry.image}
              alt={selectedEntry.title}
              style={{ maxWidth: "100%", marginBottom: "12px" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "200px",
                background: "#eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                marginBottom: "12px",
              }}
            >
              No Image
            </div>
          )}

          <p><strong>Category:</strong> {selectedEntry.category}</p>

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
