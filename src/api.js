const API_URL = "https://construction-assembly-backend.onrender.com/progress";

function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function getEntries(category = "all") {
  let url = API_URL;
  if (category && category !== "all") url += `?category=${category}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return res.json();
}

export async function searchEntries(query) {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function addEntry(entryData) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(entryData),
  });
  return res.json();
}

export async function updateEntry(id, entryData) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(entryData),
  });
  return res.json();
}

export async function deleteEntry(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}