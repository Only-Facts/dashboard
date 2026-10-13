import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import ResendVerificationForm from "../components/auth/ResendVerificationForm";

export default function ResendVerificationPage() {
  const [searchParams] = useSearchParams();

  return (
    <AuthShell
      title="New verification link"
      subtitle="If an unverified account exists for this email, a fresh link will be sent."
      footer={
        <Link className="font-medium text-blue-400" to="/login">
          Back to sign in
        </Link>
      }
    >
      <ResendVerificationForm initialEmail={searchParams.get("email") ?? ""} />
    </AuthShell>
  );
}
