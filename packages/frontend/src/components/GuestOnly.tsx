import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../services/authApi";

// Sign-in / sign-up routes: logged-in users go straight to the feed.
export default function GuestOnly() {
  if (getCurrentUser()) return <Navigate to="/posts" replace />;
  return <Outlet />;
}
