import ApiError from "./ApiError";

export async function fetchCsrfToken(signal?: AbortSignal | null) {
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
