import Dashboard from "../components/Dashboard";

export default function DashboardPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/posts";
    return null;
  }

  return (
    <div>
      <Dashboard />
    </div>
  );
}
