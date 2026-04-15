import React, { useState, useRef, useEffect } from "react";
import { removeImage, getCategories } from "../api";

function EntryForm({ entry, onClose, onSave, setDirty }) {
    const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(
    entry || { category: "", title: "", items: [{ code: "", quantity: "", description: "" }], image: "" }
  );
  const [imageFile, setImageFile] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [imagePreview, setImagePreview] = useState(entry?.image || "");
  const fileInputRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  // Cancel logic
  const handleCancel = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    if (window.confirm(entry ? "Cancel editing? Unsaved changes will be lost." : "Cancel entry registration? Unsaved data will be lost.")) {
      onClose();
    }
  };
  const [itemErrors, setItemErrors] = useState([]);


  const handleChange = (e, idx) => {
    const { name, value } = e.target;
    if (name === "category" || name === "title") {
      setFormData({ ...formData, [name]: value });
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


  const handleRemoveImage = async () => {
    if (!window.confirm("Remove the attached image?")) return;
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    // If editing and entry had an image, call backend to remove
    if (entry && entry.image) {
      await removeImage(entry._id);
    }
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { code: "", quantity: "", description: "" }],
    });
    setItemErrors([...itemErrors, {}]);
  };

  const removeItem = (idx) => {
    if (formData.items.length === 1) return; // Always keep at least one
    const item = formData.items[idx];
    const hasData = item.code || item.quantity || item.description;
    if (hasData) {
      if (!window.confirm("Are you sure you want to remove this material?")) return;
    }
    const items = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items });
    setItemErrors(itemErrors.filter((_, i) => i !== idx));
  };

  const moveItem = (idx, direction) => {
    const items = [...formData.items];
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const [movedItem] = items.splice(idx, 1);
    items.splice(newIndex, 0, movedItem);
    setFormData({ ...formData, items });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    // Validate items: code and description required
    const errors = formData.items.map(item => ({
      code: !item.code ? "Item code is required" : "",
      description: !item.description ? "Description is required" : ""
    }));
    setItemErrors(errors);
    const hasError = errors.some(err => err.code || err.description);
    if (hasError) {
      setError("Please fill in all required fields for each material.");
      setSubmitting(false);
      return;
    }
    try {
      // Prepare items: treat empty quantity as undefined
      const cleanedItems = formData.items.map(item => ({
        ...item,
        quantity: item.quantity === "" ? undefined : item.quantity
      }));
      // Use FormData for file upload
      const data = new FormData();
      data.append("category", formData.category);
      data.append("title", formData.title);
      data.append("items", JSON.stringify(cleanedItems));
      if (imageFile) {
        data.append("image", imageFile);
      }
      await onSave(data, !!imageFile); // pass FormData and flag if image is present
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
              >
                <option value="">Select category</option>
                {categories.filter(c => c.key === 'all').map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
                {categories.filter(c => c.key !== 'all').map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
              <label className="form__label">Category</label>
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
              />
              <label className="form__label">Title</label>
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

            {/* Items Section */}
            {formData.items.map((item, idx) => (
              <div key={idx} className="item-row" style={{ alignItems: 'flex-start' }}>
                <div className="form__group field code-field">
                  <input
                    type="text"
                    name="code"
                    placeholder="Item Code (required)"
                    value={item.code}
                    onChange={(e) => handleChange(e, idx)}
                    className="form__field"
                    required
                  />
                  <label className="form__label">Item Code *</label>
                  {itemErrors[idx]?.code && <div style={{ color: '#d00', fontSize: 12 }}>{itemErrors[idx].code}</div>}
                </div>

                <div className="form__group field quantity-field">
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity (optional)"
                    value={item.quantity}
                    onChange={(e) => handleChange(e, idx)}
                    className="form__field"
                    min=""
                  />
                  <label className="form__label">Quantity</label>
                </div>

                <div className="form__group field description-field">
                  <input
                    type="text"
                    name="description"
                    placeholder="Description (required)"
                    value={item.description}
                    onChange={(e) => handleChange(e, idx)}
                    className="form__field"
                    required
                  />
                  <label className="form__label">Description *</label>
                  {itemErrors[idx]?.description && <div style={{ color: '#d00', fontSize: 12 }}>{itemErrors[idx].description}</div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'center', minWidth: 32, marginTop: 8 }}>
                  <button
                    type="button"
                    title="Move up"
                    style={{ color: '#888', background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 20, padding: 0, opacity: idx === 0 ? 0.4 : 1 }}
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                  >↑</button>
                  <button
                    type="button"
                    title="Move down"
                    style={{ color: '#888', background: 'none', border: 'none', cursor: idx === formData.items.length-1 ? 'not-allowed' : 'pointer', fontSize: 20, padding: 0, opacity: idx === formData.items.length-1 ? 0.4 : 1 }}
                    disabled={idx === formData.items.length-1}
                    onClick={() => moveItem(idx, 1)}
                  >↓</button>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      title="Remove material"
                      style={{ color: '#b00', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, marginLeft: 2 }}
                      onClick={() => removeItem(idx)}
                    >×</button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" className="add-item-btn" onClick={addItem}>
              + Add Another Item
            </button>

            <div className="form-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
              <button
                type="submit"
                className="save-btn"
                disabled={submitting}
                onClick={e => {
                  if (!window.confirm(entry ? "Save changes to this entry?" : "Save this new entry?")) {
                    e.preventDefault();
                  }
                }}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
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
