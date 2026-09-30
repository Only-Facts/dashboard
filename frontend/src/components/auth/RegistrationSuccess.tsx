import { Link } from "react-router-dom";
import { primaryButtonClass } from "../common/formStyles";

export default function RegistrationSuccess({ email }: { email: string }) {
  return (
    <div className="space-y-5" role="status">
      <div className="rounded-lg border border-emerald-900 bg-emerald-950 p-4 text-emerald-100">
        <h2 className="font-semibold">Check your email</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-200">
          A verification link was sent to <strong>{email}</strong>.
          The link expires after 30 minutes.
        </p>
      </div>
      <Link to="/login" className={primaryButtonClass}>
        Continue to sign in
      </Link>
    </div>
  );
}
