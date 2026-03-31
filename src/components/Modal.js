import React, { useRef } from "react";

function Modal({ children, onClose }) {
  const overlayRef = useRef();

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
