
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyEmail } from "../api/authApi";

type VerificationStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>(
    "idle"
  );

  const [error, setError] = useState<string | null>(null);

  async function handleVerifyEmail() {
    if (!token || status === "loading") {
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      await verifyEmail(token);

      setStatus("success");

      // Remove the verification token from the browser URL.
      window.history.replaceState(
        window.history.state,
        "",
        "/verify-email"
      );
    } catch (err) {
      setStatus("error");

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Email verification
          </p>
        </div>

        {!token && status !== "success" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-400">
              Invalid verification link
            </h2>

            <p className="text-slate-400">
              Your verification link is missing a token.
              Please use the link received by email.
            </p>
          </div>
        )}

        {token && status === "idle" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">
                Confirm your email
              </h2>

              <p className="mt-2 text-slate-400">
                Click the button below to verify your email
                address and activate your Dashboard account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerifyEmail}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-500"
            >
              Verify my email
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Verifying your email...
            </h2>

            <p className="text-slate-400" role="status">
              Please wait while we confirm your account.
            </p>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-5" role="status">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-3xl text-green-400">
              ✓
            </div>

            <h2 className="text-2xl font-semibold">
              Email verified!
            </h2>

            <p className="text-slate-400">
              Your email address has been successfully
              verified. Your account is now activated.
            </p>

            <p className="text-sm text-slate-500">
              You will be able to sign in once the login
              page is available.
            </p>

            <Link
              to="/"
              className="block rounded-xl bg-blue-600 px-5 py-3 text-center font-medium transition hover:bg-blue-500"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5" role="alert">
            <h2 className="text-xl font-semibold text-red-400">
              Verification failed
            </h2>

            <p className="text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={handleVerifyEmail}
              className="w-full rounded-xl bg-slate-800 px-5 py-3 font-medium transition hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-8 border-t border-slate-800 pt-6">
          <Link
            to="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Return to home
          </Link>
        </div>

      </section>
    </main>
  );
}
