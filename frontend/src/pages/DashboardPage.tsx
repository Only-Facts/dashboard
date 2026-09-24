
import { useEffect, useState } from "react";

import {
  getBackendHealth,
  type HealthResponse,
} from "../api/healthApi";

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBackendHealth() {
      try {
        const data = await getBackendHealth();

        if (active) {
          setHealth(data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Cannot connect to Spring Boot");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBackendHealth();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900 p-6 md:flex">

        <h1 className="mb-12 text-2xl font-bold">
          Dashboard
        </h1>

        <nav className="flex flex-col gap-2">

          <a
            href="#dashboard"
            className="rounded-xl bg-slate-800 px-4 py-3 font-medium"
          >
            Overview
          </a>

          <a
            href="#services"
            className="rounded-xl px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Services
          </a>

          <a
            href="#settings"
            className="rounded-xl px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Settings
          </a>

        </nav>
      </aside>

      {/* Main content */}
      <main
        id="dashboard"
        className="flex-1 p-6 md:p-10"
      >

        <header className="mb-10">

          <h2 className="text-3xl font-bold">
            My Dashboard
          </h2>

          <p className="mt-2 text-slate-400">
            Your personal dashboard, all in one place.
          </p>

        </header>

        {/* Backend status */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="mb-4 text-xl font-semibold">
            System Status
          </h3>

          {loading && (
            <p className="text-slate-400">
              Connecting to backend...
            </p>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 p-4 text-red-400">
              {error}
            </div>
          )}

          {health && (
            <div className="flex items-center gap-3">

              <div className="h-3 w-3 rounded-full bg-green-500" />

              <div>
                <p className="font-medium text-green-400">
                  Backend: {health.status}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {health.message}
                </p>
              </div>

            </div>
          )}

        </section>

        {/* Dashboard widgets */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <h3 className="mb-3 text-xl font-semibold">
            Your Widgets
          </h3>

          <p className="text-slate-400">
            Your widgets will appear here.
          </p>

          <button
            type="button"
            disabled
            className="mt-6 cursor-not-allowed rounded-xl bg-blue-600 px-5 py-3 font-medium opacity-60"
          >
            Add Widget — Coming Soon
          </button>

        </section>

      </main>
    </div>
  );
}
