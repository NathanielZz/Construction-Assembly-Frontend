import React, { useState } from "react";
import ConfirmationDialog from "./ConfirmationDialog";

function ImageZoomModal({ src, alt, onClose }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPayload, setDialogPayload] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState({ x: 0, y: 0, startX: 0, startY: 0, dragging: false });

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(5, z + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  const handleMouseDown = (e) => {
    setDrag(d => ({ ...d, dragging: true, startX: e.clientX - d.x, startY: e.clientY - d.y }));
  };

  const handleMouseMove = (e) => {
    if (drag.dragging) {
      setDrag(d => ({ ...d, x: e.clientX - d.startX, y: e.clientY - d.startY }));
    }
  };

  const handleMouseUp = () => {
    setDrag(d => ({ ...d, dragging: false }));
  };

  React.useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 2000, cursor: drag.dragging ? 'grabbing' : 'default' }}
      onClick={onClose}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', pointerEvents: 'none'
        }}
      >
        <div style={{ marginBottom: 16, pointerEvents: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); setZoom(z => Math.min(z + 0.2, 5)); }}>Zoom In +</button>
          <button onClick={e => { e.stopPropagation(); setZoom(z => Math.max(z - 0.2, 0.5)); }}>Zoom Out -</button>
          <button onClick={e => { e.stopPropagation(); setZoom(1); setDrag({ x: 0, y: 0, startX: 0, startY: 0, dragging: false }); }}>Reset</button>
          <button
            type="button"
            style={{ marginLeft: 8 }}
            title="Download image"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const response = await fetch(src);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = alt ? `${alt.replace(/\s+/g, '_')}.jpg` : 'image.jpg';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                  a.remove();
                }, 500);
              } catch (err) {
                setDialogPayload({ message: 'Failed to download image.' });
                setDialogOpen(true);
              }
                  <ConfirmationDialog
                    open={dialogOpen}
                    type="error"
                    payload={dialogPayload}
                    onConfirm={() => setDialogOpen(false)}
                    onCancel={() => setDialogOpen(false)}
                  />
            }}
          >
            Download
          </button>
        </div>
        <div
          style={{
            maxWidth: '90vw', maxHeight: '80vh', overflow: 'hidden', background: '#fff', borderRadius: 10, boxShadow: '0 4px 32px rgba(0,0,0,0.13)', pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt}
            style={{
              transform: `scale(${zoom}) translate(${drag.x / zoom}px, ${drag.y / zoom}px)`,
              transition: drag.dragging ? 'none' : 'transform 0.2s',
              maxWidth: '100%',
              maxHeight: '100%',
              cursor: drag.dragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            draggable={false}
            onMouseDown={handleMouseDown}
          />
        </div>
        <button style={{ marginTop: 18, pointerEvents: 'auto' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ImageZoomModal;
