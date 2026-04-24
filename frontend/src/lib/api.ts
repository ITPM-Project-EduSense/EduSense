function normalizeApiBase(rawValue?: string) {
  const trimmedValue = rawValue?.trim().replace(/\/+$/, "");

  if (!trimmedValue) {
    return "/api";
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    trimmedValue.startsWith("http://")
  ) {
    return `https://${trimmedValue.slice("http://".length)}`;
  }

  return trimmedValue;
}

export const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE);

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getApiErrorMessage(payload: unknown): string {
  if (!payload) return "Something went wrong";

  if (typeof payload !== "object") {
    return "Something went wrong";
  }

  const details = payload as {
    detail?: unknown;
    message?: unknown;
  };

  if (typeof details.detail === "string") {
    return details.detail;
  }

  if (Array.isArray(details.detail)) {
    const messages = details.detail
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

  if (details.detail && typeof details.detail === "object") {
    const nestedDetails = details.detail as {
      message?: unknown;
      msg?: unknown;
    };
    if (typeof nestedDetails.message === "string") return nestedDetails.message;
    if (typeof nestedDetails.msg === "string") return nestedDetails.msg;
  }

  if (typeof details.message === "string") {
    return details.message;
  }

  return "Something went wrong";
}

/**
 * Simple health check (for testing backend connection)
 */
export async function getHealth() {
  const res = await fetch("/", {
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
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
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
