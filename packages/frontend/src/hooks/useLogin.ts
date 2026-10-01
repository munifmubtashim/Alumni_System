import { useState } from "react";
import axios from "axios";
import { login as loginRequest } from "../services/authApi";

function toLoginError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Incorrect email or password.";
    if (!error.response) return "Couldn't reach the server. Please try again.";
  }
  return "Couldn't sign in. Please try again.";
}

export function useLogin() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolves to the JWT, or null (with `error` set) on failure.
  const login = async (email: string, password: string): Promise<string | null> => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await loginRequest(email, password);
      if (!data?.token) {
        setError("No token received from server.");
        return null;
      }
      return data.token;
    } catch (err) {
      setError(toLoginError(err));
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { login, submitting, error, clearError: () => setError(null) };
}
