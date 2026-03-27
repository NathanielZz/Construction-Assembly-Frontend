import React from "react";

function ResultsTable({ entries, onEdit, onDelete }) {
  if (!entries.length) {
    return <p>No entries found.</p>;
  }

  const handleDeleteClick = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (confirmed) {
      onDelete(id);
    }
  };

  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Title</th>
          <th>Item Code</th>
          <th>Quantity</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) =>
          entry.items.map((item, idx) => (
            <tr key={`${entry._id}-${idx}`}>
              <td>{entry.category}</td>
              <td>{entry.title}</td>
              <td>{item.code}</td>
              <td>{item.quantity}</td>
              <td>{item.description}</td>
              <td>
                <button className="edit-btn" onClick={() => onEdit(entry)}>Edit</button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteClick(entry._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default ResultsTable;
