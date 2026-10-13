import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/authApi";
import AuthShell from "../components/AuthShell";
import VerificationContent from "../components/auth/VerificationContent";
import type { VerificationStatus } from "../types/verification";

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
