
// Get the API base URL from environment or fallback to relative (proxy for dev)
const API_BASE = process.env.REACT_APP_API_URL || '';

// Helper to handle fetch and errors
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      let errorMsg = 'Unknown error';
      if (contentType && contentType.includes('application/json')) {
        const errJson = await res.json();
        errorMsg = errJson.error || JSON.stringify(errJson);
      } else {
        errorMsg = await res.text();
      }
      throw new Error(errorMsg);
    }
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      return {};
    }
  } catch (err) {
    throw new Error(err.message || 'Network error');
  }
}

export async function getMaterials() {
  return fetchWithErrorHandling(`${API_BASE}/materials`);
}

export async function addMaterial(name) {
  const token = sessionStorage.getItem('token');
  return fetchWithErrorHandling(`${API_BASE}/materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name })
  });
}

export async function editMaterial(id, name) {
  const token = sessionStorage.getItem('token');
  return fetchWithErrorHandling(`${API_BASE}/materials/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name })
  });
}

export async function deleteMaterial(id) {
  const token = sessionStorage.getItem('token');
  return fetchWithErrorHandling(`${API_BASE}/materials/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}
