
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export default function ProtectedRoute() {
  const { user, loading, error, refreshUser } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Checking your session...
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="space-y-4 text-center">
          <p className="text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void refreshUser()}
            className="rounded-xl bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}
