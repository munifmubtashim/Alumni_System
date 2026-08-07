export default function DashboardPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/";
    return null;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome! You're logged in.</p>
    </div>
  );
}