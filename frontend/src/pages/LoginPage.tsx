import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/Auth";
import { AuthShell, SessionLoading, FormError, FormField, FormInput, primaryButtonClass } from "../auth/Auth";
import { useState, type FormEvent } from "react";
import { ApiError } from "../api/http";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const spotifySessionRequired = new URLSearchParams(location.search).get("spotify") === "session_required";

  if (loading) return <SessionLoading />;
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthShell
      title="Sign in"
      subtitle={spotifySessionRequired
        ? "Sign in to Orbit on this address, then click Connect Spotify again to finish connecting."
        : "Open your personal dashboard and refresh your widgets."}
      footer={
        <>
          New here?{" "}
          <Link className="font-medium text-blue-400" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

function LoginForm() {
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
        <FormInput
          id="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>

      <FormField label="Password" htmlFor="password">
        <FormInput
          id="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={64}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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

function previousLocation(state: unknown) {
  return (state as { from?: string } | null)?.from || "/";
}

function isUnverifiedError(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 403 && error.message.includes("not verified");
  }

  const cause = error instanceof Error ? error.cause : undefined;
  return cause instanceof ApiError
    && cause.status === 403
    && cause.message.includes("not verified");
}
