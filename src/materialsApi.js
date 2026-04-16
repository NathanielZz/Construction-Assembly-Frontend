// Utility to fetch materials from the backend database
export async function getMaterials() {
  const res = await fetch('/materials');
  if (!res.ok) throw new Error('Failed to load materials');
  return res.json();
}

// Add a new material (requires auth)
export async function addMaterial(name) {
  const token = sessionStorage.getItem('token');
  const res = await fetch('/materials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name })
  });
  return res.json();
}

// Edit a material (requires auth)
export async function editMaterial(id, name) {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`/materials/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name })
  });
  return res.json();
}

// Delete a material (requires auth)
export async function deleteMaterial(id) {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`/materials/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}
