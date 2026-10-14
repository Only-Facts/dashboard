import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/authApi";
import { AuthShell, primaryButtonClass } from "../auth/Auth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleVerifyEmail() {
    if (!token || status === "loading") return;

    setStatus("loading");
    setError(null);
    try {
      await verifyEmail(token);
      setStatus("success");
      window.history.replaceState(window.history.state, "", "/verify-email");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Verification only happens after you confirm here, so automated email link scanners cannot activate or consume your token."
      footer={<Link className="font-medium text-blue-400" to="/login">Back to sign in</Link>}
    >
      <VerificationContent token={token} status={status} error={error} onVerify={() => void handleVerifyEmail()} />
    </AuthShell>
  );
}

interface VerificationContentProps {
  token: string | null;
  status: VerificationStatus;
  error: string | null;
  onVerify: () => void;
}

function VerificationContent({ token, status, error, onVerify }: VerificationContentProps) {
  if (!token && status !== "success") {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950 p-4 text-sm text-red-200">
          This verification link is missing its token.
        </p>
        <Link to="/resend-verification" className="inline-block font-medium text-blue-400 underline">
          Request another link
        </Link>
      </div>
    );
  }

  if (status === "idle") {
    return <button type="button" onClick={onVerify} className={primaryButtonClass}>Confirm my email</button>;
  }

  if (status === "loading") {
    return <p role="status" className="text-sm text-slate-300">Verifying your email…</p>;
  }

  if (status === "success") {
    return (
      <div className="space-y-5" role="status">
        <div className="rounded-lg border border-emerald-900 bg-emerald-950 p-4 text-sm text-emerald-100">
          Your account is verified and ready to use.
        </div>
        <Link to="/login" className={primaryButtonClass}>Sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="alert">
      <p className="rounded-lg border border-red-900 bg-red-950 p-4 text-sm text-red-200">{error}</p>
      <button type="button" onClick={onVerify} className="w-full rounded-lg border border-slate-700 px-4 py-2.5 font-medium hover:bg-slate-800">
        Try this link again
      </button>
      <Link to="/resend-verification" className="block text-center text-sm font-medium text-blue-400 underline">
        Request a new verification link
      </Link>
    </div>
  );
}

type VerificationStatus = "idle" | "loading" | "success" | "error";
