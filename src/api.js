const API_URL = "https://construction-assembly-backend.onrender.com/progress";

export async function getEntries(category = "all") {
  let url = API_URL;
  if (category && category !== "all") url += `?category=${category}`;
  const res = await fetch(url);
  return res.json();
}

export async function searchEntries(query) {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function addEntry(entryData) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entryData),
  });
  return res.json();
}

export async function updateEntry(id, entryData) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entryData),
  });
  return res.json();
}

export async function deleteEntry(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
}
    