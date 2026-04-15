import React, { useState, useRef } from "react";
import Modal from "./Modal";
import ExcelJS from "exceljs";
import ImageZoomModal from "./ImageZoomModal";
import { duplicateEntry, setEntryHidden, updateEntry } from "../api";
import EntryForm from "./EntryForm";
import ConfirmationDialog from "./ConfirmationDialog";

function ResultsGallery({ entries, onEdit, onDelete, selectedEntry, setSelectedEntry, showEdit, setShowEdit, page, setPage, entriesPerPage, isAuthenticated, showHidden, setShowHidden, reloadEntries }) {
  // State for edit confirmation
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const editFormDirtyRef = useRef(false);
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadingMulti, setDownloadingMulti] = useState(false);
      // Toggle selection for a card
      const handleSelectCard = (id) => {
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
        );
      };

      // Select all visible cards
      const handleSelectAll = () => {
        const pageIds = paginatedEntries.map((e) => e._id);
        setSelectedIds((prev) =>
          pageIds.every((id) => prev.includes(id))
            ? prev.filter((id) => !pageIds.includes(id))
            : [...prev, ...pageIds.filter((id) => !prev.includes(id))]
        );
      };

      // Download selected entries as one Excel file, side by side in one worksheet
      const handleDownloadSelectedExcel = async () => {
        setDownloadingMulti(true);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Selected Entries");
        const selectedEntries = entries.filter((e) => selectedIds.includes(e._id));
        // Find max items for row alignment
        const maxItems = Math.max(...selectedEntries.map(e => (e.items?.length || 0)));

        // Prepare columns: each entry gets 2 columns (Description, Quantity), with a space column between entries
        let colOffset = 1;
        // Track where each image should be placed (row per entry)
        const imagePlacements = [];
        selectedEntries.forEach((entry, idx) => {
          // Title row: TITLE (CATEGORY) only
          let title = entry.title;
          if (entry.category) {
            title += ` (${formatCategory(entry.category)})`;
          }
          worksheet.mergeCells(1, colOffset, 1, colOffset + 1);
          worksheet.getCell(1, colOffset).value = title;
          worksheet.getCell(1, colOffset).alignment = { horizontal: "center", vertical: "middle" };
          worksheet.getCell(1, colOffset).font = { bold: true, size: 14 };
          // Header row
          worksheet.getCell(2, colOffset).value = "Description";
          worksheet.getCell(2, colOffset).font = { bold: true };
          worksheet.getCell(2, colOffset + 1).value = "Quantity";
          worksheet.getCell(2, colOffset + 1).font = { bold: true };
          worksheet.getCell(2, colOffset + 1).alignment = { horizontal: "center" };
          // Data rows
          for (let i = 0; i < maxItems; ++i) {
            const item = entry.items?.[i];
            worksheet.getCell(3 + i, colOffset).value = item ? item.description : "";
            worksheet.getCell(3 + i, colOffset + 1).value = item ? item.quantity || "" : "";
            worksheet.getCell(3 + i, colOffset + 1).alignment = { horizontal: "center" };
          }
          // Track where to put the image for this entry
          imagePlacements.push({
            entry,
            colOffset,
            imgRow: maxItems + 4 // row directly after the last data row (no extra space)
          });
          // Borders and column width
          for (let r = 1; r <= maxItems + 2; ++r) {
            for (let c = colOffset; c <= colOffset + 1; ++c) {
              worksheet.getCell(r, c).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
              };
            }
          }
          worksheet.getColumn(colOffset).width = Math.max(12, ...(entry.items || []).map(i => (i.description || "").length));
          worksheet.getColumn(colOffset + 1).width = 10;

          // Add image under the table if available
          // Image will be placed after all columns are set (see below)

          // Add a space column after each entry except the last
          if (idx < selectedEntries.length - 1) {
            colOffset += 3; // 2 for entry, 1 for space
            worksheet.getColumn(colOffset - 1).width = 2;
          } else {
            colOffset += 2;
          }
        });

        // Wait for all images to be fetched and embed them
        await Promise.all(imagePlacements.map(async ({ entry, colOffset, imgRow }) => {
          if (entry.image) {
            try {
              const res = await fetch(entry.image);
              const blob = await res.blob();
              const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              const ext = entry.image.split('.').pop().toLowerCase();
              const imageId = workbook.addImage({
                base64: dataUrl.split(',')[1],
                extension: ext === 'jpg' ? 'jpeg' : ext
              });
              worksheet.addImage(imageId, {
                tl: { col: colOffset - 1, row: imgRow - 1 },
                ext: { width: 160, height: 120 }
              });
            } catch (e) {
              // Ignore image errors
            }
          }
        }));
        // Improved file name
        let fileName = "Materials_Export_" + new Date().toISOString().slice(0,10);
        if (selectedEntries.length === 1) {
          fileName = `Materials_${selectedEntries[0].title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}`;
        } else if (selectedEntries.length > 1) {
          fileName = `Materials_${selectedEntries[0].title.replace(/\s+/g, "_")}_and_more_${new Date().toISOString().slice(0,10)}`;
        }
        fileName += ".xlsx";
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();
          setDownloadingMulti(false);
        }, 1200);
      };
    const [actionLoading, setActionLoading] = useState(false);
    // Duplicate entry handler
    const handleDuplicate = async (entry) => {
      setActionLoading(true);
      try {
        await duplicateEntry(entry._id);
        if (reloadEntries) reloadEntries();
        alert("Card duplicated!");
      } catch (e) {
        alert("Failed to duplicate card.");
      }
      setActionLoading(false);
    };

    // Hide/unhide entry handler
    const handleHide = async (entry, hide) => {
      setActionLoading(true);
      try {
        await setEntryHidden(entry._id, hide);
        if (reloadEntries) reloadEntries();
        alert(hide ? "Card hidden!" : "Card unhidden!");
        setSelectedEntry(null);
      } catch (e) {
        alert("Failed to update card visibility.");
      }
      setActionLoading(false);
    };
  // Sort entries alphabetically by title (case-insensitive)
  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.title && !b.title) return 0;
    if (!a.title) return 1;
    if (!b.title) return -1;
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
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
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Materials");
    // Compose title as "Title (Item Code | Category)"
    let title = entry.title;
    if (entry.items && entry.items[0] && entry.items[0].code && entry.category) {
      title += ` (${entry.items[0].code} | ${formatCategory(entry.category)})`;
    } else if (entry.items && entry.items[0] && entry.items[0].code) {
      title += ` (${entry.items[0].code})`;
    } else if (entry.category) {
      title += ` (${formatCategory(entry.category)})`;
    }
    worksheet.addRow([title]);
    worksheet.mergeCells("A1:B1");
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.addRow(["Description", "Quantity"]);
    worksheet.getCell("A2").font = { bold: true };
    worksheet.getCell("B2").font = { bold: true };
    worksheet.getCell("B2").alignment = { horizontal: "center" };
    entry.items.forEach(item => {
      worksheet.addRow([item.description, item.quantity || ""]);
    });
    // Center quantity column
    for (let i = 3; i < entry.items.length + 3; ++i) {
      worksheet.getCell(`B${i}`).alignment = { horizontal: "center" };
    }
    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: false }, function(row) {
      row.eachCell({ includeEmpty: false }, function(cell) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    });
    worksheet.columns = [
      { width: Math.max(12, ...entry.items.map(i => (i.description || "").length)) },
      { width: 10 }
    ];
    // Embed image if available
    if (entry.image) {
      try {
        // Fetch image as blob and convert to base64
        const response = await fetch(entry.image);
        const blob = await response.blob();
        // Get image dimensions
        const img = new window.Image();
        const imgUrl = URL.createObjectURL(blob);
        const imgDims = await new Promise((resolve, reject) => {
          img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(imgUrl);
          };
          img.onerror = reject;
          img.src = imgUrl;
        });
        // Set fixed height for Excel image, scale width proportionally
        const fixedHeight = 200; // px
        let { width, height } = imgDims;
        if (height !== fixedHeight) {
          const ratio = fixedHeight / height;
          width = Math.round(width * ratio);
          height = fixedHeight;
        }
        // Convert to base64
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const ext = entry.image.split('.').pop().toLowerCase();
        const imageId = workbook.addImage({
          base64: base64,
          extension: ext === 'jpg' ? 'jpeg' : ext
        });
        worksheet.addImage(imageId, {
          tl: { col: 2.2, row: 0.2 },
          ext: { width, height }
        });
      } catch (err) {
        // If image fails, just skip embedding
        console.error('Failed to embed image in Excel:', err);
      }
    }
    // Download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entry.title.replace(/\s+/g, "_")}_materials.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
      setDownloadingId(null);
    }, 1200);
  };

  // Pagination logic
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
  const paginatedEntries = sortedEntries.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  // Always use the latest entry data from entries array
  const currentEntry = selectedEntry ? entries.find(e => e._id === selectedEntry._id) : null;

  const [zoomImage, setZoomImage] = React.useState(null);


  return (
    <div className="gallery" style={{ minHeight: '70vh', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', justifyContent: 'center', alignContent: 'flex-start', position: 'relative' }}>
      {/* Multi-select controls */}

      {entries.length > 0 && (
        <div style={{ gridColumn: '1 / -1', margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={paginatedEntries.length > 0 && paginatedEntries.every(e => selectedIds.includes(e._id))}
              onChange={handleSelectAll}
              style={{ accentColor: '#38caef', width: 18, height: 18 }}
            />
            Select All
          </label>
          <button
            onClick={handleDownloadSelectedExcel}
            disabled={selectedIds.length === 0 || downloadingMulti}
            style={{ background: '#38caef', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 5, fontWeight: 500, fontSize: 14, boxShadow: '0 2px 8px rgba(38,202,239,0.10)', transition: 'background 0.2s', opacity: selectedIds.length === 0 ? 0.6 : 1 }}
          >
            {downloadingMulti ? 'Downloading...' : `Download Selected to Excel (${selectedIds.length})`}
          </button>
          <label style={{ display: 'inline-flex', alignItems: 'center', background: '#f7fbfd', border: '1.2px solid #38caef', borderRadius: 18, padding: '4px 12px 4px 8px', fontSize: 13, color: '#2596be', fontWeight: 500, boxShadow: '0 2px 8px rgba(38,202,239,0.08)', cursor: 'pointer', gap: 6, zIndex: 10, marginLeft: 'auto' }}>
            <span style={{marginRight: 5, fontWeight: 600}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38caef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <input type="checkbox" checked={!!showHidden} onChange={e => setShowHidden(e.target.checked)} style={{accentColor:'#38caef', width:18, height:18, marginRight:6}} />
            Show hidden cards
          </label>
        </div>
      )}


      {paginatedEntries.map((entry) => (
        <div key={entry._id} className="card" style={{position:'relative', minHeight: '220px'}}>
          {/* Hidden icon if showHidden is on and entry is hidden */}
          {showHidden && entry.hidden && (
            <span style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              background: 'rgba(234,179,8,0.95)',
              color: '#fff',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(234,179,8,0.18)',
              border: '2px solid #fff',
            }} title="Hidden Card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 2.06-3.06"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </span>
          )}
          {entry.image && (
            <img src={entry.image} alt="Entry" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
          )}
          <div className="card-content">
            <h3>{entry.title}</h3>
            <p className="category">{formatCategory(entry.category)}</p>
          </div>

          <button className="view-btn" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
            <input
              type="checkbox"
              checked={selectedIds.includes(entry._id)}
              onClick={e => { e.stopPropagation(); handleSelectCard(entry._id); }}
              className="card-checkbox"
              title="Select card"
              style={{margin:0}}
            />
            <span style={{flex:1,textAlign:'center'}} onClick={e => { e.stopPropagation(); setSelectedEntry(entry); setShowEdit(false); }}>
              View Details
            </span>
          </button>
        </div>
      ))}

      {/* Pagination controls */}
      {(totalPages > 1 || true) && (
        <div style={{ gridColumn: '1 / -1', width: '100%', margin: '32px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, background: '#f7fbfd', borderRadius: 12, padding: '8px 12px', boxShadow: '0 2px 8px rgba(38,202,239,0.06)' }}>
              <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt;</button>
              {(() => {
                const pages = [];
                // Removed unused variable maxShown
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

          {/* Go to Top button below hidden toggle */}
          <div style={{ margin: '10px 0 0 0', textAlign: 'center', width: '100%', display: 'flex', justifyContent: 'center' }}>
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
      )}



      {currentEntry && !showEdit && (
        <Modal onClose={() => setSelectedEntry(null)}>
          <div className="modal-header modal-actions" style={{gap: '10px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap'}}>
            {isAuthenticated && (
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="edit-btn" style={{background:'#38caef',color:'#fff',border:'none',padding:'8px 14px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(38,202,239,0.10)',transition:'background 0.2s'}} onClick={() => setShowEdit(true)} title="Edit Entry" disabled={actionLoading}>Edit</button>
                <button className="delete-btn" style={{background:'#e11d48',color:'#fff',border:'none',padding:'8px 14px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(225,29,72,0.10)',transition:'background 0.2s'}} onClick={() => handleDeleteClick(currentEntry._id)} title="Delete Entry" disabled={actionLoading}>Delete</button>
                <button className="duplicate-btn" style={{background:'linear-gradient(90deg,#2596be 60%,#38caef 100%)',color:'#fff',border:'none',padding:'8px 14px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(38,150,190,0.13)',transition:'background 0.2s'}} onClick={() => handleDuplicate(currentEntry)} title="Duplicate Card" disabled={actionLoading}>Duplicate</button>
                {currentEntry.hidden ? (
                  <button className="hide-btn" style={{background:'#6b7280',color:'#fff',border:'none',padding:'8px 14px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(107,114,128,0.10)',transition:'background 0.2s'}} onClick={() => handleHide(currentEntry, false)} disabled={actionLoading} title="Unhide Card">Unhide</button>
                ) : (
                  <button className="hide-btn" style={{background:'#eab308',color:'#fff',border:'none',padding:'8px 14px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(234,179,8,0.10)',transition:'background 0.2s'}} onClick={() => handleHide(currentEntry, true)} disabled={actionLoading} title="Hide Card">Hide</button>
                )}
              </div>
            )}
            <button className="download-excel-btn" style={{background:'#fff',color:'#2596be',border:'1.5px solid #38caef',padding:'8px 14px',borderRadius:6,fontWeight:600,boxShadow:'0 2px 8px rgba(38,202,239,0.10)',transition:'background 0.2s'}} onClick={() => handleDownloadExcel(currentEntry)} title="Download" disabled={downloadingId === currentEntry._id || actionLoading}>
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
            <button className="close-modal" style={{background:'none',color:'#e11d48',border:'none',fontSize:28,fontWeight:700,marginLeft:6,cursor:'pointer',lineHeight:1}} onClick={() => setSelectedEntry(null)} title="Close">&times;</button>
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
            {isAuthenticated && (
              <div style={{marginTop:24}}>
                <span style={{fontSize:13, color:'#888'}}>
                  Status: {currentEntry.hidden ? <b style={{color:'#eab308'}}>Hidden</b> : <b style={{color:'#32CD32'}}>Visible</b>}
                </span>
              </div>
            )}
          </div>

        </Modal>
      )}

      {/* Show hidden cards toggle for admins */}


      {zoomImage && (
        <ImageZoomModal src={zoomImage} alt={currentEntry?.title || "Zoomed image"} onClose={() => setZoomImage(null)} />
      )}

      {currentEntry && showEdit && (
        <>
          <Modal
            onClose={() => {
              if (editFormDirtyRef.current) {
                setShowEditConfirm(true);
              } else {
                setShowEdit(false);
              }
            }}
          >
            <EntryForm
              entry={currentEntry}
              onClose={() => {
                if (editFormDirtyRef.current) {
                  setShowEditConfirm(true);
                } else {
                  setShowEdit(false);
                }
              }}
              onSave={async (formData, hasImage) => {
                // Save edited entry to backend
                await updateEntry(currentEntry._id, formData);
                setShowEdit(false);
                if (typeof reloadEntries === "function") reloadEntries();
              }}
              setDirty={val => (editFormDirtyRef.current = val)}
            />
          </Modal>
          <ConfirmationDialog
            open={showEditConfirm}
            type="cancel"
            onConfirm={() => {
              setShowEdit(false);
              setShowEditConfirm(false);
            }}
            onCancel={() => {
              setShowEditConfirm(false);
            }}
          />
        </>
      )}
    </div>
  );
}

export default ResultsGallery;
