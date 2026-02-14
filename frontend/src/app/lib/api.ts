const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/`);
  return res.json();
}
