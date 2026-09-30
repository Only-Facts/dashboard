import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import FormError from "../common/FormError";
import FormField from "../common/FormField";
import { inputClass, primaryButtonClass } from "../common/formStyles";
import { isUnverifiedError, previousLocation } from "../../utils/auth";

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setUnverified(false);

    try {
      await signIn({ email, password });
      navigate(previousLocation(location.state), { replace: true });
    } catch (err) {
      setUnverified(isUnverifiedError(err));
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Email address" htmlFor="email">
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Password" htmlFor="password">
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={64}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </FormField>

      {error && (
        <FormError>
          <p>{error}</p>
          {unverified && (
            <Link
              to={`/resend-verification?email=${encodeURIComponent(email)}`}
              className="mt-2 inline-block font-medium underline"
            >
              Send a new verification link
            </Link>
          )}
        </FormError>
      )}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

