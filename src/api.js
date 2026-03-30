const API_URL = "https://construction-assembly-backend.onrender.com/progress";

// ✅ Helper for JSON requests (safe for non-FormData)
function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ✅ Get entries
export async function getEntries(category = "all") {
  let url = API_URL;
  if (category && category !== "all") url += `?category=${category}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return res.json();
}

// ✅ Search entries
export async function searchEntries(query) {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// ✅ Add entry with image upload (FormData)
export async function addEntry(entryData) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ Do not set Content-Type here, browser will set multipart/form-data
    },
    body: entryData, // FormData from EntryForm
  });
  return res.json();
}

// ✅ Update entry with image upload (FormData)
export async function updateEntry(id, entryData) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ Same rule: no Content-Type for FormData
    },
    body: entryData,
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
