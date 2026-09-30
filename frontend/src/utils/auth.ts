import { ApiError } from "../api/http";

export function previousLocation(state: unknown) {
  return (state as { from?: string } | null)?.from || "/";
}

export function isUnverifiedError(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 403 && error.message.includes("not verified");
  }

  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof ApiError
    && cause.status === 403
    && cause.message.includes("not verified");
}
