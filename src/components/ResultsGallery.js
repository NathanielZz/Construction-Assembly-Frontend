import React from "react";
import Modal from "./Modal";
import * as XLSX from "xlsx";
import ImageZoomModal from "./ImageZoomModal";

function ResultsGallery({ entries, onEdit, onDelete, selectedEntry, setSelectedEntry, showEdit, setShowEdit, page, setPage, entriesPerPage, isAuthenticated }) {
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

  // Excel download with formatted header and merged title/category, centered and bold
  const [downloadingId, setDownloadingId] = React.useState(null);
  const handleDownloadExcel = async (entry) => {
    setDownloadingId(entry._id);
    const title = entry.title + (entry.category ? ` (${formatCategory(entry.category)})` : "");
    const wsData = [
      [title, null],
      ["Description", "Quantity"],
      ...entry.items
        .map(item => [item.description, item.quantity || ""])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Merge the first row
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    // Style: Center title/category
    ws['A1'].s = {
      alignment: { horizontal: "center", vertical: "center" },
      font: { bold: true, sz: 14 }
    };
    // Style: Bold headers
    ws['A2'].s = { font: { bold: true } };
    ws['B2'].s = { font: { bold: true }, alignment: { horizontal: "center" } };
    // Style: Center quantity column
    for (let i = 3; i < wsData.length + 1; ++i) {
      const cell = ws[`B${i}`];
      if (cell) cell.s = { alignment: { horizontal: "center" } };
    }
    // Add borders to all cells
    const borderStyle = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = ws[cellAddress].s || {};
        ws[cellAddress].s.border = borderStyle;
      }
    }
    // Auto-width columns
    ws['!cols'] = [
      { wch: Math.max(12, ...entry.items.map(i => (i.description || "").length)) },
      { wch: 10 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materials");
    XLSX.writeFile(wb, `${entry.title.replace(/\s+/g, "_")}_materials.xlsx`);
    setTimeout(() => setDownloadingId(null), 1200);
  };

  // Pagination logic
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
  const paginatedEntries = sortedEntries.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  // Always use the latest entry data from entries array
  const currentEntry = selectedEntry ? entries.find(e => e._id === selectedEntry._id) : null;

  const [zoomImage, setZoomImage] = React.useState(null);

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
            {isAuthenticated ? (
              <>
                <button className="edit-btn" onClick={() => setShowEdit(true)} title="Edit Entry">Edit</button>
                <button className="delete-btn" onClick={() => handleDeleteClick(currentEntry._id)} title="Delete Entry">Delete</button>
              </>
            ) : null}
            <button className="download-excel-btn" onClick={() => handleDownloadExcel(currentEntry)} title="Download" disabled={downloadingId === currentEntry._id}>
              {downloadingId === currentEntry._id ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 50 50" style={{ verticalAlign: 'middle' }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#2596be" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                  Downloading...
                </span>
              ) : "Download"}
            </button>
            <button className="close-modal" onClick={() => setSelectedEntry(null)} title="Close">&times;</button>
          </div>
          <div className="modal-body">
            <h2 style={{marginTop:0}}>{currentEntry.title}</h2>
            <p><strong>Category:</strong> {formatCategory(currentEntry.category)}</p>
            {currentEntry.image && (
              <div style={{ margin: '16px 0' }}>
                <img
                  src={currentEntry.image}
                  alt="Entry"
                  style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, border: '1px solid #ccc', cursor: 'zoom-in' }}
                  onClick={() => setZoomImage(currentEntry.image)}
                />
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

      {zoomImage && (
        <ImageZoomModal src={zoomImage} alt={currentEntry?.title || "Zoomed image"} onClose={() => setZoomImage(null)} />
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
