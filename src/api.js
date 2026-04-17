// Bulk save all categories at once
export async function bulkSaveCategories(categories) {
  const res = await fetch(CATEGORY_API_URL + '/bulk-save', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ categories })
  });
  return res.json();
}
// CATEGORY MANAGEMENT API
const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const CATEGORY_API_URL = `${BASE_URL}/categories`;

export async function getCategories() {
  const res = await fetch(CATEGORY_API_URL, { headers: getAuthHeaders() });
  return res.json();
}

export async function addCategory(category) {
  const res = await fetch(CATEGORY_API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(category),
  });
  return res.json();
}

export async function editCategory(key, updates) {
  const res = await fetch(`${CATEGORY_API_URL}/${key}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteCategory(key) {
  const res = await fetch(`${CATEGORY_API_URL}/${key}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.json();
}
const API_URL = `${BASE_URL}/progress`;

// ✅ Helper for JSON requests
function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// ✅ Get entries (auto-detect guest or admin, supports showHidden)
export async function getEntries(category = "all", isAuthenticated = false, showHidden = false) {
  let url = API_URL;
  const params = [];
  if (category && category !== "all") params.push(`category=${encodeURIComponent(category)}`);
  if (showHidden) params.push("showHidden=1");
  if (params.length) url += `?${params.join("&")}`;
  const options = { };
  if (isAuthenticated) {
    options.headers = getAuthHeaders();
  }
  const res = await fetch(url, options);
  return res.json();
}

// Duplicate entry
export async function duplicateEntry(id) {
  const res = await fetch(`${API_URL}/${id}/duplicate`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// Hide/unhide entry
export async function setEntryHidden(id, hide = true) {
  const res = await fetch(`${API_URL}/${id}/hide`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ hide })
  });
  return res.json();
}

// ✅ Search entries
export async function searchEntries(query, filter = "title") {
  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filter)}`, {
    headers,
  });
  return res.json();
}


// Add entry (supports FormData for image upload)
export async function addEntry(entryData) {
  let headers = {};
  let body = entryData;
  if (!(entryData instanceof FormData)) {
    headers = getAuthHeaders();
    body = JSON.stringify(entryData);
  } else {
    headers = { Authorization: getAuthHeaders().Authorization };
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body,
  });
  return res.json();
}


// Update entry (supports FormData for image upload)
export async function updateEntry(id, entryData) {
  let headers = {};
  let body = entryData;
  if (!(entryData instanceof FormData)) {
    headers = getAuthHeaders();
    body = JSON.stringify(entryData);
  } else {
    headers = { Authorization: getAuthHeaders().Authorization };
  }
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers,
    body,
  });
  return res.json();
}

// Remove image from entry
export async function removeImage(id) {
  const res = await fetch(`${API_URL}/${id}/remove-image`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// ✅ Delete entry
export async function deleteEntry(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.json();
}

// ✅ Download materials list
export async function downloadMaterials() {
  const token = sessionStorage.getItem("token");
  const res = await fetch(`${API_URL}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.blob(); // caller handles saving
}
