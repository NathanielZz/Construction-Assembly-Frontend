import React, { useRef, useEffect } from "react";

function Modal({ children, onClose }) {
  const overlayRef = useRef();

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.classList.add("modal-open");
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, background: 'rgba(0,0,0,0.04)', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 4px 32px rgba(0,0,0,0.13)' }}>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
