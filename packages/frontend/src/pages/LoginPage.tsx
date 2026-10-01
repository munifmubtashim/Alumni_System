import { Alert, App, theme } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LoginForm, { type LoginValues } from "../components/LoginForm";
import { useLogin } from "../hooks/useLogin";
import AuthLayout from "../layouts/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionExpired = params.get("session") === "expired";
  const { login, submitting, error, clearError } = useLogin();
  const { message } = App.useApp();
  const {
    token: { margin },
  } = theme.useToken();

  const handleSubmit = async ({ email, password }: LoginValues) => {
    const token = await login(email, password);
    if (!token) return;
    localStorage.setItem("token", token);
    message.success("Login successful!");
    navigate("/posts", { replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your alumni account"
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      {sessionExpired && !error && (
        <Alert
          type="warning"
          showIcon
          title="Your session has expired. Please sign in again."
          style={{ marginBottom: margin }}
        />
      )}
      <LoginForm submitting={submitting} error={error} onSubmit={handleSubmit} onEdit={clearError} />
    </AuthLayout>
  );
}
