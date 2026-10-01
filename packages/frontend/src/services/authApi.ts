import axios from "axios";
import type { AuthResponse, RegisterInput } from "@alumni/shared";

export async function login(email: string, password: string) {
  const res = await axios.post("/api/auth/login", { email, password });
  return res.data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const res = await axios.post("/api/auth/register", input);
  return res.data;
}

type TokenPayload = { sub: number; role: string; exp?: number };

function readTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    // JWT segments are base64url-encoded.
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(segment));
  } catch {
    return null;
  }
}

const isExpired = (payload: TokenPayload) => !!payload.exp && payload.exp * 1000 <= Date.now();

// The logged-in user from the stored JWT, or null if there is none or it has expired.
export function getCurrentUser(): { id: number; role: string } | null {
  const payload = readTokenPayload();
  if (!payload || isExpired(payload)) return null;
  return { id: payload.sub, role: payload.role };
}

// True when a token is stored but has expired (used to explain why the user is back on the login page).
export function isSessionExpired(): boolean {
  const payload = readTokenPayload();
  return !!payload && isExpired(payload);
}

export function logout(reason?: "expired") {
  localStorage.removeItem("token");
  window.location.href = reason === "expired" ? "/?session=expired" : "/";
}