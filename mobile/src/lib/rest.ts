import { getApiBase, getToken } from "./platform";

/** An error from the REST API (or a network failure, status 0). `message` is safe to show to people. */
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
  get isNetwork() { return this.status === 0 || this.status >= 500; }
}

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  const base = getApiBase();
  if (!base) throw new ApiError(0, "NO_SERVER", "No server address is set. Open Server settings on the sign-in screen.");
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1${path}`, {
      method, credentials: "omit", signal,
      headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch { throw new ApiError(0, "NETWORK", "Can't reach the server. Check your connection and try again."); }

  const text = await response.text();
  let json: any;
  try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }

  if (!response.ok) {
    // A 401 can be a momentary backend hiccup, so it never signs you out by itself. Only the session check
    // in Protected (GET /auth/me confirmed twice) clears a dead token.
    const error = json?.error;
    if (!error && response.status >= 500) throw new ApiError(response.status, "SERVER", "The Karyano server had a problem. Please try again.");
    if (!error && response.status === 404) throw new ApiError(404, "NOT_FOUND", "The server does not support the mobile API yet. Deploy the latest portal version.");
    if (response.status === 401) throw new ApiError(401, "UNAUTHORIZED", "Your session could not be verified. Pull down to retry; if it keeps happening, sign in again.");
    throw new ApiError(response.status, error?.code ?? "ERROR", friendly(error) ?? `Request failed (${response.status}).`);
  }
  if (json === undefined) throw new ApiError(response.status, "BAD_RESPONSE", "The server returned an unexpected response. Is the server address correct?");
  return json.data as T;
}

/** Turn Zod validation details into one readable sentence. */
function friendly(error?: { message?: string; details?: unknown }): string | undefined {
  if (!error) return undefined;
  if (Array.isArray(error.details) && error.details.length) {
    const first = error.details[0] as { path?: (string | number)[]; message?: string };
    const field = first.path?.filter(p => typeof p === "string").join(" ");
    return `${field ? field[0].toUpperCase() + field.slice(1) + ": " : ""}${first.message ?? "is invalid"}`;
  }
  return error.message;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/** Build a query string, skipping empty values. */
export function qs(params: Record<string, string | number | undefined | null>) {
  const parts = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
