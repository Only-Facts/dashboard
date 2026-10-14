import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/Auth";
import { AuthShell, SessionLoading, FormError, FormField, FormInput, primaryButtonClass } from "../auth/Auth";
import { register } from "../api/authApi";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const [registeredEmail, setRegisteredEmail] = useState("");

  if (loading) return <SessionLoading />;
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthShell
      title="Create account"
      subtitle="Register, verify your email, then build your own dashboard."
      footer={
        <>
          Already registered?{" "}
          <Link className="font-medium text-blue-400" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      {registeredEmail ? (
        <RegistrationSuccess email={registeredEmail} />
      ) : (
        <RegisterForm onSuccess={setRegisteredEmail} />
      )}
    </AuthShell>
  );
}

interface RegisterFormProps {
  onSuccess: (email: string) => void;
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await register({ email, username, password });
      onSuccess(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Email address" htmlFor="email">
        <FormInput id="email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)} />
      </FormField>

      <FormField
        label="Username"
        htmlFor="username"
        hint="3–30 letters, numbers, or underscores."
      >
        <FormInput id="username" type="text" autoComplete="username" required minLength={3}
          maxLength={30} pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only"
          value={username} onChange={(event) => setUsername(event.target.value)} />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        hint="Use at least 12 characters. A long passphrase works well."
      >
        <FormInput id="password" type="password" autoComplete="new-password" required minLength={12}
          maxLength={64} value={password} onChange={(event) => setPassword(event.target.value)} />
      </FormField>

      <FormField label="Confirm password" htmlFor="confirm-password">
        <FormInput id="confirm-password" type="password" autoComplete="new-password" required maxLength={64}
          value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </FormField>

      {error && <FormError>{error}</FormError>}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function RegistrationSuccess({ email }: { email: string }) {
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
