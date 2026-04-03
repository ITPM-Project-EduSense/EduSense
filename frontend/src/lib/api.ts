const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Simple health check (for testing backend connection)
 */
export async function getHealth() {
  const res = await fetch(`${API_BASE.replace("/api", "")}/`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Backend not reachable");
  }

  return res.json();
}

/**
 * Generic API fetch wrapper
 * Automatically includes cookies for authentication.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // REQUIRED for JWT cookie
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data?.detail || data?.message || "Something went wrong",
      response.status,
      data
    );
  }

  return data;
}