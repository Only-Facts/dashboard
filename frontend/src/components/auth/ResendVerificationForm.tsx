import { useState, type FormEvent } from "react";
import { resendVerification } from "../../api/authApi";
import FormError from "../common/FormError";
import FormField from "../common/FormField";
import { inputClass, primaryButtonClass } from "../common/formStyles";

interface ResendVerificationFormProps {
  initialEmail: string;
}

export default function ResendVerificationForm({ initialEmail }: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await resendVerification(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a new link.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-emerald-900 bg-emerald-950 p-4 text-sm leading-6 text-emerald-100">
        If this address belongs to an unverified account, a new verification email has been sent.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Email address" htmlFor="email">
        <input id="email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
      </FormField>
      {error && <FormError>{error}</FormError>}
      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Sending…" : "Send new link"}
      </button>
    </form>
  );
}
