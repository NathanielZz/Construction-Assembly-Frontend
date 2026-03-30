const API_URL = "https://construction-assembly-backend.onrender.com/progress";

// ✅ Helper for JSON requests
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

// ✅ Add entry (JSON only)
export async function addEntry(entryData) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(entryData),
  });
  return res.json();
}

// ✅ Update entry (JSON only)
export async function updateEntry(id, entryData) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(entryData),
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
