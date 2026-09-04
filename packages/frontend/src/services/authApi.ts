import axios from "axios";

export async function login(email: string, password: string) {
  const res = await axios.post(
    "http://localhost:3000/api/auth/login",
    { email, password }
  );
  return res.data;
}

export function getCurrentUser(): { id: number; role: string } | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}