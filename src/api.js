// CATEGORY MANAGEMENT API
const CATEGORY_API_URL = process.env.REACT_APP_CATEGORY_API_URL || "http://localhost:5000/categories";

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
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/progress";
// Always use this for guests (do not override with env)
const PUBLIC_API_URL = "http://localhost:5000/public/progress";

// ✅ Helper for JSON requests
function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ✅ Get entries (auto-detect guest or admin)
export async function getEntries(category = "all", isAuthenticated = false) {
  // Always use PUBLIC_API_URL for guests, never override with env
  let url = isAuthenticated ? API_URL : PUBLIC_API_URL;
  if (category && category !== "all") url += `?category=${category}`;
  if (isAuthenticated) {
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  } else {
    // Always use the hardcoded public endpoint for guests
    const res = await fetch(PUBLIC_API_URL + (category && category !== "all" ? `?category=${category}` : ""));
    return res.json();
  }
}

// ✅ Search entries
export async function searchEntries(query) {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
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
