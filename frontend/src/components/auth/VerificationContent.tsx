import { Link } from "react-router-dom";
import type { VerificationStatus } from "../../types/verification";
import { primaryButtonClass } from "../common/formStyles";

interface VerificationContentProps {
  token: string | null;
  status: VerificationStatus;
  error: string | null;
  onVerify: () => void;
}

export default function VerificationContent({ token, status, error, onVerify }: VerificationContentProps) {
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
