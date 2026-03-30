import React, { useState } from "react";

function EntryForm({ entry, onClose, onSave }) {
  const [formData, setFormData] = useState(
    entry || { category: "", title: "", image: null, items: [{ code: "", quantity: "", description: "" }] }
  );
  const [preview, setPreview] = useState(entry?.image || null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setPreview(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { code: "", quantity: "", description: "" }],
    });
  };

  const moveItem = (idx, direction) => {
    const items = [...formData.items];
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const [movedItem] = items.splice(idx, 1);
    items.splice(newIndex, 0, movedItem);
    setFormData({ ...formData, items });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("category", formData.category); // ✅ camelCase key
    data.append("title", formData.title);
    if (formData.image) {
      data.append("image", formData.image);
    }
    data.append("items", JSON.stringify(formData.items));
    onSave(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{entry ? "Edit Entry" : "Register New Entry"}</h2>
        </div>
        <div className="modal-body">
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
                <option value="singlePhase">Single Phase</option>
                <option value="threePhase">Three Phase</option>
                <option value="anchor">Anchor</option>
                <option value="secondary">Secondary</option>
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

            {/* Image Upload + Preview */}
            <div className="form__group field">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form__field"
              />
              <label className="form__label">Upload Image</label>
            </div>

            {preview && (
              <div style={{ marginTop: "10px", position: "relative", display: "inline-block" }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer"
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Items Section */}
            {formData.items.map((item, idx) => (
              <div key={idx} className="item-row">
                <div className="form__group field code-field">
                  <input
                    type="text"
                    name="code"
                    placeholder="Item Code"
                    value={item.code}
                    onChange={(e) => handleChange(e, idx)}
                    className="form__field"
                  />
                  <label className="form__label">Item Code</label>
                </div>

                <div className="form__group field quantity-field">
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleChange(e, idx)}
                    className="form__field"
                  />
                  <label className="form__label">Quantity</label>
                </div>

                <div className="form__group field description-field">
                  <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleChange(e, idx)}
                    className="form__field"
                  />
                  <label className="form__label">Description</label>
                </div>

                <div className="reorder-buttons">
                  <button type="button" onClick={() => moveItem(idx, -1)}>↑</button>
                  <button type="button" onClick={() => moveItem(idx, 1)}>↓</button>
                </div>
              </div>
            ))}

            <button type="button" className="add-item-btn" onClick={addItem}>
              + Add Another Item
            </button>

            <div className="form-actions">
              <button type="submit" className="save-btn">Save</button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EntryForm;
