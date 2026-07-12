const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  json?: any;
}

export class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers);

  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Crucial: enables sending/receiving HTTP-only cookies
  };

  let response = await fetch(url, fetchOptions);

  // If unauthenticated (401) on a protected route, attempt silent token refresh
  if (
    response.status === 401 &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/register") &&
    path !== "/auth/refresh"
  ) {
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        // Retry the original request with the fresh cookie
        response = await fetch(url, fetchOptions);
      }
    } catch (e) {
      console.error("Token refresh attempt failed:", e);
    }
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: "Network request failed" };
    }
    const message = errorData.detail || `Request failed with status ${response.status}`;
    throw new APIError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: "GET" }),
  post: (path: string, json?: any, options?: RequestOptions) => request(path, { ...options, method: "POST", json }),
  put: (path: string, json?: any, options?: RequestOptions) => request(path, { ...options, method: "PUT", json }),
  patch: (path: string, json?: any, options?: RequestOptions) => request(path, { ...options, method: "PATCH", json }),
  delete: (path: string, options?: RequestOptions) => request(path, { ...options, method: "DELETE" }),
};
