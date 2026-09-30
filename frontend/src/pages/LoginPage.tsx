import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AuthShell from "../components/AuthShell";
import LoginForm from "../components/auth/LoginForm";
import SessionLoading from "../components/common/SessionLoading";

export default function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) return <SessionLoading />;
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthShell
      title="Sign in"
      subtitle="Open your personal dashboard and refresh your widgets."
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
