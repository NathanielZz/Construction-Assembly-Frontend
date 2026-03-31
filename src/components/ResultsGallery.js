import React from "react";
import Modal from "./Modal";

function ResultsGallery({ entries, onEdit, onDelete, selectedEntry, setSelectedEntry, showEdit, setShowEdit, page, setPage, entriesPerPage }) {
  // Sort entries by most recent (createdAt descending), fallback to _id if no createdAt
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    // fallback: sort by _id (MongoDB ObjectId has timestamp)
    return (b._id > a._id ? 1 : -1);
  });

  const handleDeleteClick = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (confirmed) {
      onDelete(id);
      setSelectedEntry(null);
    }
  };

  // Helper to format camelCase into spaced words
  const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
  };

  // PDF download
  const handleDownloadPDF = (entry) => {
    // Dynamically import jsPDF only when needed
    import("jspdf").then(jsPDFModule => {
      const doc = new jsPDFModule.jsPDF();
      doc.setFontSize(18);
      doc.text(entry.title, 10, 20);
      doc.setFontSize(14);
      doc.text("Category: " + formatCategory(entry.category), 10, 30);
      doc.setFontSize(12);
      doc.text("Materials:", 10, 40);
      let y = 50;
      entry.items.forEach((item, idx) => {
        doc.text(`${idx + 1}. ${item.code} — ${item.quantity} × ${item.description}`, 10, y);
        y += 10;
      });
      doc.save(`${entry.title.replace(/\s+/g, "_")}_materials.pdf`);
    });
  };


  // Pagination logic
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
  const paginatedEntries = sortedEntries.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  // Always use the latest entry data from entries array
  const currentEntry = selectedEntry ? entries.find(e => e._id === selectedEntry._id) : null;

  return (
    <div className="gallery">
      {entries.length === 0 && <p>No entries found.</p>}

      {paginatedEntries.map((entry) => (
        <div key={entry._id} className="card">
          {entry.image && (
            <img src={entry.image} alt="Entry" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
          )}
          <div className="card-content">
            <h3>{entry.title}</h3>
            <p className="category">{formatCategory(entry.category)}</p>
          </div>

          <button className="view-btn" onClick={() => { setSelectedEntry(entry); setShowEdit(false); }}>
            View Details
          </button>
        </div>
      ))}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt;</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              style={{ fontWeight: page === i + 1 ? 'bold' : 'normal', minWidth: 32 }}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>&gt;</button>
        </div>
      )}

      {currentEntry && !showEdit && (
        <Modal onClose={() => setSelectedEntry(null)}>
          <div className="modal-header modal-actions" style={{gap: '8px', justifyContent: 'flex-end', alignItems: 'center'}}>
            <button className="edit-btn" onClick={() => setShowEdit(true)} title="Edit Entry">Edit</button>
            <button className="delete-btn" onClick={() => handleDeleteClick(currentEntry._id)} title="Delete Entry">Delete</button>
            <button className="download-btn" onClick={() => handleDownloadPDF(currentEntry)} title="Download PDF">Download</button>
            <button className="close-modal" onClick={() => setSelectedEntry(null)} title="Close">&times;</button>
          </div>
          <div className="modal-body">
            <h2 style={{marginTop:0}}>{currentEntry.title}</h2>
            <p><strong>Category:</strong> {formatCategory(currentEntry.category)}</p>
            {currentEntry.image && (
              <div style={{ margin: '16px 0' }}>
                <img src={currentEntry.image} alt="Entry" style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, border: '1px solid #ccc' }} />
              </div>
            )}
            <h3>Materials</h3>
            <ol style={{ paddingLeft: 20 }}>
              {currentEntry.items.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.code}</strong>
                  {item.quantity ? ` — ${item.quantity} ×` : ''} {item.description}
                </li>
              ))}
            </ol>
          </div>
        </Modal>
      )}

      {currentEntry && showEdit && (
        (() => {
          if (typeof onEdit === "function") {
            onEdit(currentEntry);
            setShowEdit(false);
            return null;
          }
          return null;
        })()
      )}
    </div>
  );
}

export default ResultsGallery;
