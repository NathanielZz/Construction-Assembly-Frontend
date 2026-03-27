import React, { useState } from "react";

function EntryForm({ entry, onClose, onSave }) {
  const [formData, setFormData] = useState(
    entry || { category: "", title: "", items: [{ code: "", quantity: "", description: "" }] }
  );

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

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { code: "", quantity: "", description: "" }],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
                    maxLength={10}
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
