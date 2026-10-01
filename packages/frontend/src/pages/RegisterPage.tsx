import { App } from "antd";
import { Link, useNavigate } from "react-router-dom";
import type { RegisterInput } from "@alumni/shared";
import RegisterForm from "../components/RegisterForm";
import { useRegister } from "../hooks/useRegister";
import AuthLayout from "../layouts/AuthLayout";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { register, submitting } = useRegister();

  const handleSubmit = async (input: RegisterInput) => {
    const { token } = await register(input);
    localStorage.setItem("token", token);
    message.success("Welcome to the alumni network!");
    navigate("/posts", { replace: true });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the alumni network"
      footer={
        <>
          Already have an account? <Link to="/">Sign in</Link>
        </>
      }
    >
      <RegisterForm submitting={submitting} onSubmit={handleSubmit} />
    </AuthLayout>
  );
}
