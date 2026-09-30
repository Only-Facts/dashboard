import { useState, type FormEvent } from "react";
import { register } from "../../api/authApi";
import FormError from "../common/FormError";
import FormField from "../common/FormField";
import { inputClass, primaryButtonClass } from "../common/formStyles";

interface RegisterFormProps {
  onSuccess: (email: string) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
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
        <input id="email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
      </FormField>

      <FormField
        label="Username"
        htmlFor="username"
        hint="3–30 letters, numbers, or underscores."
      >
        <input id="username" type="text" autoComplete="username" required minLength={3}
          maxLength={30} pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only"
          value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass} />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        hint="Use at least 12 characters. A long passphrase works well."
      >
        <input id="password" type="password" autoComplete="new-password" required minLength={12}
          maxLength={64} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
      </FormField>

      <FormField label="Confirm password" htmlFor="confirm-password">
        <input id="confirm-password" type="password" autoComplete="new-password" required maxLength={64}
          value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
      </FormField>

      {error && <FormError>{error}</FormError>}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
