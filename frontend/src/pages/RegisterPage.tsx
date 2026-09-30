import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AuthShell from "../components/AuthShell";
import RegisterForm from "../components/auth/RegisterForm";
import RegistrationSuccess from "../components/auth/RegistrationSuccess";
import SessionLoading from "../components/common/SessionLoading";

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
