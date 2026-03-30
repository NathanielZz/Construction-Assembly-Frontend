const API_URL = "https://construction-assembly-backend.onrender.com/progress";

function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    // ⚠️ Do NOT set Content-Type here when sending FormData
    "Content-Type": "application/json",
  };
}

// ✅ Get entries
export async function getEntries(category = "all") {
  let url = API_URL;
  if (category && category !== "all") url += `?category=${category}`;
  const token = sessionStorage.getItem("token");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ✅ Search entries
export async function searchEntries(query) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ✅ Add entry with image upload
export async function addEntry(entryData) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ no Content-Type, browser sets it for FormData
    },
    body: entryData, // entryData is FormData from EntryForm
  });
  return res.json();
}

// ✅ Update entry with image upload
export async function updateEntry(id, entryData) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: entryData, // FormData again
  });
  return res.json();
}

// ✅ Delete entry
export async function deleteEntry(id) {
  const token = sessionStorage.getItem("token");
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
