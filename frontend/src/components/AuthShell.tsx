import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 sm:p-8">
        <header className="mb-7">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-widest text-blue-400"
          >
            Orbit Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {subtitle}
          </p>
        </header>

        {children}

        {footer && (
          <footer className="mt-7 border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
            {footer}
          </footer>
        )}
      </section>
    </main>
  );
}
