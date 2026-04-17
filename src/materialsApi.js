

// Use the same pattern as api.js for deployment compatibility
const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const MATERIALS_API_URL = `${BASE_URL}/materials`;

function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

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
  return fetchWithErrorHandling(MATERIALS_API_URL, { headers: getAuthHeaders() });
}

export async function addMaterial(name) {
  return fetchWithErrorHandling(MATERIALS_API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  });
}

export async function editMaterial(id, name) {
  return fetchWithErrorHandling(`${MATERIALS_API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  });
}

export async function deleteMaterial(id) {
  return fetchWithErrorHandling(`${MATERIALS_API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}
