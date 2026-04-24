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

function getApiErrorMessage(payload: any): string {
  if (!payload) return "Something went wrong";

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    const messages = payload.detail
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          if (typeof msg === "string") return msg;
        }
        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (payload.detail && typeof payload.detail === "object") {
    if (typeof payload.detail.message === "string") return payload.detail.message;
    if (typeof payload.detail.msg === "string") return payload.detail.msg;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return "Something went wrong";
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
      getApiErrorMessage(data),
      response.status,
      data
    );
  }

  return data;
}