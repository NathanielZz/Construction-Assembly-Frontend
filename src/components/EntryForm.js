import React, { useState, useRef, useEffect } from "react";
import { removeImage, getCategories } from "../api";
import { getMaterials } from "../materialsApi";
import ConfirmationDialog from "./ConfirmationDialog";
// Removed dnd-kit imports; using up/down buttons for ordering

function EntryForm({ entry, onClose, onSave, setDirty, requireSaveConfirm }) {
  // --- PROFESSIONAL SOLUTION: STABLE IDS AND LOCAL STATE ---
  // 1. Generate a stable id for each item only when loaded or added
  // 2. Never regenerate all ids on every render or entry change
  // 3. Let EntryForm manage its own state; parent only passes initial data
  // Helper to generate a unique id for each item row
  const generateItemId = () => '_' + Math.random().toString(36).substr(2, 9);

  // Assign a stable id to each item only once (when loaded or added)
  const assignIds = (items) => items.map(item => ({ ...item, _id: item._id || generateItemId() }));

  // Initialize form state ONCE from entry prop (never re-initialize on every render)
  const [formData, setFormData] = useState(() => {
    if (entry && entry.items && entry.items.length > 0) {
      return { ...entry, items: assignIds(entry.items) };
    } else {
      return { category: "", title: "", items: [{ code: "", quantity: "", description: "", unitOfMeasure: "", _id: generateItemId() }], image: "" };
    }
  });
  const [imageFile, setImageFile] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [imagePreview, setImagePreview] = useState(entry?.image || "");
  const fileInputRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Materials state
  const [materials, setMaterials] = useState([]);
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const data = await getMaterials();
        setMaterials(data);
      } catch {
        setMaterials([]);
      }
    }
    fetchMaterials();
  }, []);

  // Helper to reset form state to original entry (only assign ids to new items)
  const resetFormState = () => {
    let resetItems;
    if (entry && entry.items && entry.items.length > 0) {
      resetItems = assignIds(entry.items);
    } else {
      resetItems = [{ code: "", quantity: "", description: "", unitOfMeasure: "", _id: generateItemId() }];
    }
    setFormData(entry ? { ...entry, items: resetItems } : { category: "", title: "", items: resetItems, image: "" });
    setImageFile(null);
    setImagePreview(entry?.image || "");
    setItemErrors([]);
  };
  const [isClosed, setIsClosed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Detect changes to form fields
  useEffect(() => {
    setIsDirty(false);
    // eslint-disable-next-line
  }, [entry]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        if (Array.isArray(data)) {
          // Sort by order, put 'all' first if present, filter out hidden
          const sorted = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).filter(cat => !cat.hidden);
          setCategories(sorted);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      }
    }
    fetchCategories();
  }, [entry]);

  useEffect(() => {
    const orig = entry || { category: "", title: "", items: [{ code: "", quantity: "", description: "" }], image: "" };
    const dirty =
      formData.category !== orig.category ||
      formData.title !== orig.title ||
      (formData.image !== orig.image) ||
      formData.items.length !== orig.items.length ||
      formData.items.some((item, i) => item.code !== (orig.items[i]?.code || "") || item.quantity !== (orig.items[i]?.quantity || "") || item.description !== (orig.items[i]?.description || "")) ||
      imageFile;
    setIsDirty(dirty);
    if (setDirty) setDirty(dirty);
  }, [formData, imageFile, entry, setDirty]);

  // Close on ESC key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Cancel logic with custom dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const handleCancel = () => {
    if (!isDirty) {
      resetFormState();
      setIsClosed(true);
      onClose();
      return;
    }
    setShowCancelDialog(true);
  };
  const [itemErrors, setItemErrors] = useState([]);


  const handleChange = (e, idx) => {
    const { name, value } = e.target;
    if (name === "category" || name === "title") {
      setFormData({ ...formData, [name]: value });
    } else if (name === "description" && idx !== undefined) {
      const items = [...formData.items];
      items[idx][name] = value;
      // Auto-fill unitOfMeasure if material exists
      const matched = materials.find(mat => mat.name === value);
      if (matched && matched.unitOfMeasure) {
        items[idx].unitOfMeasure = matched.unitOfMeasure;
      }
      setFormData({ ...formData, items });
    } else {
      const items = [...formData.items];
      items[idx][name] = value;
      setFormData({ ...formData, items });
    }
  };

  // Handle image file selection

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // If editing and there was an old image, mark for removal
      if (entry && entry.image) {
        setFormData((prev) => ({ ...prev, image: "" }));
      }
    }
  };

  // Handle paste image from clipboard
  const handleImagePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        if (entry && entry.image) {
          setFormData((prev) => ({ ...prev, image: "" }));
        }
      }
    }
  };

  // Remove image (frontend only, for new uploads)


  const [showRemoveImageDialog, setShowRemoveImageDialog] = useState(false);
  const handleRemoveImage = async () => {
    setShowRemoveImageDialog(true);
  };
  const confirmRemoveImage = async () => {
    setShowRemoveImageDialog(false);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (entry && entry.image) {
      await removeImage(entry._id);
    }
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { code: "", quantity: "", description: "", unitOfMeasure: "", _id: generateItemId() }],
    }));
    setItemErrors([...itemErrors, {}]);
  };

  const [removeIdx, setRemoveIdx] = useState(null);
  const removeItem = (idx) => {
    if (formData.items.length === 1) return; // Always keep at least one
    const item = formData.items[idx];
    const hasData = item.code || item.quantity || item.description || item.unitOfMeasure;
    if (hasData) {
      setRemoveIdx(idx);
      return;
    }
    const items = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items });
    setItemErrors(itemErrors.filter((_, i) => i !== idx));
  };
  const confirmRemoveItem = () => {
    if (removeIdx === null) return;
    const items = formData.items.filter((_, i) => i !== removeIdx);
    setFormData({ ...formData, items });
    setItemErrors(itemErrors.filter((_, i) => i !== removeIdx));
    setRemoveIdx(null);
  };

  // Removed unused moveItem function (was not used)


  // (removed duplicate showSaveDialog declaration)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    // Title, item code, and material name (description) are required
    const errors = formData.items.map(item => ({
      code: !item.code ? "Item code is required" : "",
      description: !item.description ? "Material name is required" : ""
    }));
    setItemErrors(errors);
    const hasError = errors.some(err => err.code || err.description);
    if (hasError) {
      setError("Please fill in the item code and material name for each item.");
      setSubmitting(false);
      return;
    }
    // If confirmation required, show dialog first
    if (requireSaveConfirm) {
      setShowSaveDialog(true);
      setSubmitting(false);
      return;
    }
    await actuallySave();
  };

  // Actually perform save
  const actuallySave = async () => {
    setSubmitting(true);
    try {
      const cleanedItems = formData.items.map(item => ({
        ...item,
        quantity: item.quantity === "" ? undefined : item.quantity
      }));
      const data = new FormData();
      data.append("category", formData.category);
      data.append("title", formData.title);
      data.append("items", JSON.stringify(cleanedItems));
      if (imageFile) {
        data.append("image", imageFile);
      }
      await onSave(data, !!imageFile);
    } catch (err) {
      let msg = "An error occurred while saving. Please try again.";
      if (err && err.message) {
        msg += "\n" + err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };


  // Move item up or down
  const moveItem = (idx, direction) => {
    const items = [...formData.items];
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const [moved] = items.splice(idx, 1);
    items.splice(newIndex, 0, moved);
    setFormData({ ...formData, items });
  };

  return (
    <div
      className="modal-overlay"
      style={{ overflow: 'hidden' }}
      onClick={e => {
        if (e.target.classList.contains('modal-overlay')) handleCancel();
      }}
    >
      <div className="modal" style={{ maxWidth: 700, width: '100%', minWidth: 380, overflowX: 'visible' }}>
        <div className="modal-header">
          <h2>{entry ? "Edit Entry" : "Register New Entry"}</h2>
        </div>
        <ConfirmationDialog
          open={showCancelDialog}
          type="cancel"
          onConfirm={() => { resetFormState(); setShowCancelDialog(false); setIsClosed(true); onClose(); }}
          onCancel={() => setShowCancelDialog(false)}
        />
        <ConfirmationDialog
          open={showSaveDialog}
          type="save"
          onConfirm={() => { setShowSaveDialog(false); actuallySave(); }}
          onCancel={() => setShowSaveDialog(false)}
        />
        <div className="modal-body">
          {error && (
            <div style={{ color: '#d00', background: '#fff0f0', padding: '10px', borderRadius: 4, marginBottom: 12, fontWeight: 500 }}>
              {error}
            </div>
          )}
          <form className="entry-form" onSubmit={handleSubmit}>
            {/* Category Dropdown */}
            <div className="form__group field">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form__field"
                required
                disabled={isClosed}
              >
                <option value="">Select category</option>
                {categories.filter(c => c.key !== 'all').map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
              <label className="form__label">Category <span style={{color:'#b00'}}>*</span></label>
            </div>

            {/* Title Input */}
            <div className="form__group field">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form__field"
                placeholder="Title"
                required
                disabled={isClosed}
              />
              <label className="form__label">Title <span style={{color:'#b00'}}>*</span></label>
            </div>


            {/* Image Upload */}
            <div
              className="form__group field image-upload-area"
              onPaste={handleImagePaste}
              style={{ position: 'relative', background: '#f7fbfd', border: '2px dashed #38caef', borderRadius: 8, padding: 16, marginBottom: 8, marginTop: 4, maxWidth: 260 }}
            >
              <label className="form__label" style={{ color: '#2596be', fontWeight: 500 }}>Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ zIndex: 2, position: 'relative', marginBottom: 6 }}
              />
              <div style={{ fontSize: 13, color: '#2596be', marginTop: 2, fontWeight: 500 }}>
                Click to choose a file or <span style={{ color: '#116399' }}>paste an image here</span>
              </div>
              {imagePreview && (
                <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, border: '1px solid #38caef', background: '#fff' }} />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{ position: "absolute", top: 0, right: 0, background: "#fff", border: "none", color: "#d00", fontWeight: "bold", fontSize: 18, cursor: "pointer", borderRadius: "50%", width: 28, height: 28, boxShadow: '0 1px 4px rgba(38,202,239,0.12)' }}
                    title="Remove image"
                  >×</button>
                </div>
              )}
            </div>

            {/* Materials Divider */}
            <div style={{ fontWeight: 'bold', fontSize: '1.1em', margin: '24px 0 8px 0', letterSpacing: 1 }}>Materials:</div>
            {/* Items Section (with up/down buttons for ordering) */}

            {formData.items.map((item, idx) => {
              return (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 16, minWidth: 16, textAlign: 'right', fontWeight: 500, color: '#2596be', fontSize: 13, marginRight: 2, userSelect: 'none', paddingLeft: 0 }}>{idx + 1}.</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="form__group field code-field" style={{ minWidth: 110, maxWidth: 130, flex: '1 1 110px' }}>
                      <input
                        type="text"
                        name="code"
                        placeholder="Item Code (required)"
                        value={item.code}
                        onChange={(e) => handleChange(e, idx)}
                        className="form__field"
                        required
                        disabled={isClosed}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const next = document.querySelector(`#item-quantity-${idx}`);
                            if (next) next.focus();
                          }
                        }}
                        id={`item-code-${idx}`}
                      />
                      <label className="form__label">Item Code <span style={{color:'#b00'}}>*</span></label>
                      {itemErrors[idx]?.code && <div style={{ color: '#d00', fontSize: 12 }}>{itemErrors[idx].code}</div>}
                    </div>

                    <div className="form__group field quantity-field" style={{ minWidth: 100, maxWidth: 120, flex: '1 1 100px' }}>
                      <input
                        type="number"
                        name="quantity"
                        placeholder="Quantity (optional)"
                        value={item.quantity}
                        onChange={(e) => handleChange(e, idx)}
                        className="form__field"
                        min=""
                        disabled={isClosed}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const next = document.querySelector(`#item-description-${idx}`);
                            if (next) next.focus();
                          }
                        }}
                        id={`item-quantity-${idx}`}
                      />
                      <label className="form__label">Quantity</label>
                    </div>

                    <div className="form__group field description-field" style={{ minWidth: 170, maxWidth: 220, flex: '2 1 170px' }}>
                      <input
                        type="text"
                        name="description"
                        list={`material-desc-${idx}`}
                        placeholder="Material Name (required)"
                        value={item.description}
                        onChange={(e) => handleChange(e, idx)}
                        className="form__field"
                        required
                        disabled={isClosed}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const next = document.querySelector(`#item-uom-${idx}`);
                            if (next) next.focus();
                          }
                        }}
                        id={`item-description-${idx}`}
                      />
                      <datalist id={`material-desc-${idx}`}>
                        {materials.map(mat => (
                          <option key={mat.name} value={mat.name}>{mat.name}</option>
                        ))}
                      </datalist>
                      <label className="form__label">Material Name <span style={{color:'#b00'}}>*</span></label>
                      {itemErrors[idx]?.description && <div style={{ color: '#d00', fontSize: 12 }}>{itemErrors[idx].description}</div>}
                    </div>

                    <div className="form__group field uom-field" style={{ minWidth: 120, maxWidth: 150, flex: '1 1 120px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        name="unitOfMeasure"
                        placeholder="Unit of Measure"
                        value={item.unitOfMeasure || ""}
                        onChange={(e) => handleChange(e, idx)}
                        className="form__field"
                        disabled={isClosed}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Focus next row's code field if exists
                            const next = document.querySelector(`#item-code-${idx + 1}`);
                            if (next) next.focus();
                          }
                        }}
                        id={`item-uom-${idx}`}
                        style={{ paddingRight: 28 }}
                      />
                      <label className="form__label">Unit of Measure</label>
                      {/* UOM Info Popover */}
                      <div
                        style={{
                          position: 'absolute',
                          right: 4,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: item.unitOfMeasure ? 'pointer' : 'not-allowed',
                          opacity: item.unitOfMeasure ? 1 : 0.4
                        }}
                        tabIndex={0}
                        aria-label="Show unit of measure"
                        onMouseEnter={e => {
                          const pop = e.currentTarget.querySelector('.uom-popover');
                          if (pop) pop.style.display = 'block';
                        }}
                        onMouseLeave={e => {
                          const pop = e.currentTarget.querySelector('.uom-popover');
                          if (pop) pop.style.display = 'none';
                        }}
                        onFocus={e => {
                          const pop = e.currentTarget.querySelector('.uom-popover');
                          if (pop) pop.style.display = 'block';
                        }}
                        onBlur={e => {
                          const pop = e.currentTarget.querySelector('.uom-popover');
                          if (pop) pop.style.display = 'none';
                        }}
                      >
                        <span style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#e6f7ff',
                          color: '#2596be',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                          marginLeft: 4,
                          border: '1px solid #38caef',
                          boxShadow: '0 1px 4px rgba(38,202,239,0.10)'
                        }}>i</span>
                        <div
                          className="uom-popover"
                          style={{
                            display: 'none',
                            position: 'absolute',
                            right: 28,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#fff',
                            color: '#2596be',
                            border: '1px solid #38caef',
                            borderRadius: 6,
                            boxShadow: '0 2px 12px rgba(38,202,239,0.13)',
                            padding: '10px 16px',
                            minWidth: 120,
                            fontSize: 14,
                            fontWeight: 500,
                            zIndex: 10,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none'
                          }}
                        >
                          {item.unitOfMeasure ? (
                            <span>Unit: <span style={{ color: '#116399', fontWeight: 700 }}>{item.unitOfMeasure}</span></span>
                          ) : (
                            <span style={{ color: '#b00' }}>No UOM set</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Action area: Up/Down/Remove */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 8 }}>
                    <button
                      type="button"
                      title="Move up"
                      style={{
                        color: '#fff',
                        background: '#2596be',
                        border: 'none',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        padding: 0,
                        width: 22,
                        height: 22,
                        minWidth: 0,
                        minHeight: 0,
                        borderRadius: 4,
                        lineHeight: 1,
                        transition: 'background 0.2s, color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'none',
                        opacity: idx === 0 ? 0.5 : 1,
                        marginRight: 2
                      }}
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0 || isClosed}
                      onMouseOver={e => { if (!isClosed && idx !== 0) e.target.style.background = '#116399'; }}
                      onMouseOut={e => { if (!isClosed && idx !== 0) e.target.style.background = '#2596be'; }}
                    >↑</button>
                    <button
                      type="button"
                      title="Move down"
                      style={{
                        color: '#fff',
                        background: '#2596be',
                        border: 'none',
                        cursor: idx === formData.items.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        padding: 0,
                        width: 22,
                        height: 22,
                        minWidth: 0,
                        minHeight: 0,
                        borderRadius: 4,
                        lineHeight: 1,
                        transition: 'background 0.2s, color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'none',
                        opacity: idx === formData.items.length - 1 ? 0.5 : 1,
                        marginRight: 2
                      }}
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === formData.items.length - 1 || isClosed}
                      onMouseOver={e => { if (!isClosed && idx !== formData.items.length - 1) e.target.style.background = '#116399'; }}
                      onMouseOut={e => { if (!isClosed && idx !== formData.items.length - 1) e.target.style.background = '#2596be'; }}
                    >↓</button>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        title="Remove material"
                        style={{ color: '#fff', background: '#b00', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0, width: 22, height: 22, minWidth: 0, minHeight: 0, borderRadius: 4, lineHeight: 1, transition: 'background 0.2s, color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}
                        onClick={() => removeItem(idx)}
                        disabled={isClosed}
                        onMouseOver={e => { e.target.style.background = '#d00'; }}
                        onMouseOut={e => { e.target.style.background = '#b00'; }}
                      >×</button>
                    )}
                  </div>
                </div>
              );
            })}


            <button type="button" className="add-item-btn" onClick={addItem}>
              + Add Another Item
            </button>

            {/* Remove image confirmation dialog */}
            <ConfirmationDialog
              open={showRemoveImageDialog}
              type="delete"
              payload={{ cat: { label: 'the attached image' } }}
              onConfirm={confirmRemoveImage}
              onCancel={() => setShowRemoveImageDialog(false)}
            />

            {/* Remove item confirmation dialog */}
            <ConfirmationDialog
              open={removeIdx !== null}
              type="delete"
              payload={{ cat: { label: 'this material' } }}
              onConfirm={confirmRemoveItem}
              onCancel={() => setRemoveIdx(null)}
            />

            <div className="form-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
              <button
                type="button"
                className="save-btn"
                disabled={submitting}
                onClick={() => setShowSaveDialog(true)}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
              <ConfirmationDialog
                open={!!showSaveDialog}
                type="save"
                onConfirm={() => { setShowSaveDialog(false); document.querySelector('.entry-form').requestSubmit(); }}
                onCancel={() => setShowSaveDialog(false)}
              />
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EntryForm;
