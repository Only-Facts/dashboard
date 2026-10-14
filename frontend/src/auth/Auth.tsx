/* eslint-disable react-refresh/only-export-components */
import { useCallback, useContext, useEffect, useState, createContext, type InputHTMLAttributes, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const location = useLocation();
  const authPath = location.pathname;
  const isSignIn = authPath === "/login";
  const isSignUp = authPath === "/register";

  return (
    <main className="auth-overlay text-slate-100">
      <DashboardPreview />
      <div className="auth-overlay__backdrop" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="auth-card"
      >
        <header className="auth-card__header">
          <Link to="/" className="auth-card__brand">
            <span className="auth-card__brand-mark">◌</span>
            <span>orbit</span>
          </Link>
          <Link to="/" aria-label="Close authentication" className="auth-card__close">
            ×
          </Link>
        </header>

        {(isSignIn || isSignUp) && (
          <nav className="auth-tabs" aria-label="Authentication">
            <Link className={isSignIn ? "is-active" : ""} to="/login">Sign in</Link>
            <Link className={isSignUp ? "is-active" : ""} to="/register">Sign up</Link>
          </nav>
        )}

        <div className="auth-card__content">
          <h1 id="auth-title" className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {subtitle}
          </p>

          <div className="mt-6">{children}</div>

          {footer && <footer className="auth-card__footer">{footer}</footer>}
        </div>
      </section>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="auth-dashboard-preview" aria-hidden="true">
      <header className="workspace-header">
        <div className="orbit-brand">
          <span className="auth-preview-orbit">◌</span>
          orbit<span className="brand-divider" />
          <span className="workspace-label">Personal workspace</span>
        </div>
        <nav className="workspace-nav">
          <span>Overview</span>
          <span>Services</span>
        </nav>
        <div className="workspace-account">
          <span className="account-avatar">OR</span>
          <span>Sign in</span>
        </div>
      </header>
      <main className="workspace-main">
        <div className="workspace-container">
          <p className="eyebrow">YOUR DAILY PERSPECTIVE</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Your space. Your way.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Everything you follow, in one place.
          </p>
          <section className="auth-preview-grid">
            {[
              ["Weather", "18° · Bordeaux"],
              ["Exchange rate", "EUR → USD"],
              ["Latest stories", "Technology & ideas"],
              ["Air quality", "European AQI"],
            ].map(([title, value]) => (
              <article key={title} className="auth-preview-widget">
                <span className="auth-preview-widget__dot" />
                <strong>{title}</strong>
                <span>{value}</span>
                <i />
                <i />
                <i />
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, htmlFor, children, hint }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {label}
      <span className="mt-2 block">{children}</span>
      {hint && (
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-200"
    >
      {children}
    </div>
  );
}

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

export function FormInput(props: FormInputProps) {
  return <input {...props} className={inputClass} />;
}

export function SessionLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">
      <p role="status">Checking your session…</p>
    </main>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

export const primaryButtonClass =
  "block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

import { getCurrentUser, login, logout, type LoginRequest, type User } from "../api/authApi";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setUser(await getCurrentUser());
    } catch (err) {
      setUser(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => active && setUser(currentUser))
      .catch((err: unknown) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  async function signIn(request: LoginRequest) {
    setUser(await login(request));
    setError(null);
  }

  async function signOut() {
    await logout();
    setUser(null);
    setError(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to check authentication.";
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (request: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
