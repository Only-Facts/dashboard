
import { Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<DashboardPage />}
      />

      <Route
        path="/verify-email"
        element={<VerifyEmailPage />}
      />

      <Route
        path="*"
        element={
          <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold">
                404
              </h1>

              <p className="mt-3 text-slate-400">
                This page does not exist.
              </p>

              <a
                href="/"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-medium"
              >
                Return to Dashboard
              </a>
            </div>
          </main>
        }
      />
    </Routes>
  );
}
