export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchCsrfToken(signal?: AbortSignal | null) {
  const response = await fetch("/api/auth/csrf", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new ApiError("Unable to initialize your security session.", response.status);
  }

  const body = (await response.json()) as { token?: string };
  if (!body.token) {
    throw new ApiError("Invalid CSRF response from the server.", 500);
  }
  return body.token;
}

interface ErrorBody {
  error?: string;
  fields?: Record<string, string>;
}

async function errorMessage(response: Response) {
  if (response.status === 401) return "Your session has expired. Please sign in again.";
  if (response.status === 429) return "Too many requests. Please wait a minute.";

  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  if (body.fields) return Object.values(body.fields).join(". ");
  return body.error || `Request failed (${response.status}). Please try again.`;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!SAFE_METHODS.has(method)) {
    headers.set("X-CSRF-TOKEN", await fetchCsrfToken(options.signal));
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
