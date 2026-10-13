interface ErrorBody {
  error?: string;
  fields?: Record<string, string>;
}

export async function errorMessage(response: Response) {
  if (response.status === 401) return "Your session has expired. Please sign in again.";
  if (response.status === 429) return "Too many requests. Please wait a minute.";

  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  if (body.fields) return Object.values(body.fields).join(". ");
  return body.error || `Request failed (${response.status}). Please try again.`;
}
