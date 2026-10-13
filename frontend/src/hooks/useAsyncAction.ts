import { useState } from "react";
import { ApiError } from "../api/http";

export function useAsyncAction(onUnauthorized?: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(task: () => Promise<void>) {
    if (busy) return false;

    setBusy(true);
    setError("");
    try {
      await task();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiError && err.status === 401 && onUnauthorized) {
        await onUnauthorized();
      }
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, setError, run };
}
