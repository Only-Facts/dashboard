import { Link, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResendVerificationPage from "./pages/ResendVerificationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

const publicRoutes = [
  ["/login", <LoginPage />],
  ["/register", <RegisterPage />],
  ["/verify-email", <VerifyEmailPage />],
  ["/resend-verification", <ResendVerificationPage />],
] as const;

export default function App() {
  return (
    <Routes>
      {publicRoutes.map(([path, element]) => (
        <Route key={path} path={path} element={element} />
      ))}
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <Link to="/" className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2.5 font-medium hover:bg-blue-500">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
