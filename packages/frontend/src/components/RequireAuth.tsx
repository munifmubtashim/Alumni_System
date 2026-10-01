import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../services/authApi";

export default function RequireAuth() {
  if (!getCurrentUser()) return <Navigate to="/" replace />;
  return <Outlet />;
}
