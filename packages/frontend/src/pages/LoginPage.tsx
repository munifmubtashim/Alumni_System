import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const handleSuccess = (token: string) => {
    localStorage.setItem("token", token); 
    window.location.href = "/dashboard";
  };

  return (
    <div>
      <h2>Login</h2>
      <LoginForm onSuccess={handleSuccess} />
    </div>
  );
}