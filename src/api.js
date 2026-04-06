const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/progress";
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
  let url = isAuthenticated ? API_URL : PUBLIC_API_URL;
  if (category && category !== "all") url += `?category=${category}`;
  const res = isAuthenticated
    ? await fetch(url, { headers: getAuthHeaders() })
    : await fetch(url);
  return res.json();
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
