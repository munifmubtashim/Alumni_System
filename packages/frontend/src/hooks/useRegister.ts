import { useState } from "react";
import axios from "axios";
import type { AuthResponse, RegisterInput } from "@alumni/shared";
import { register as registerRequest } from "../services/authApi";

export type RegisterError = {
  field?: keyof RegisterInput;
  message: string;
};

function toRegisterError(error: unknown): RegisterError {
  if (axios.isAxiosError(error)) {
    const message: string = error.response?.data?.message ?? "Sign up failed. Please try again.";
    if (error.response?.status === 409) return { field: "email", message };
    return { message };
  }
  return { message: "Sign up failed. Please try again." };
}

export function useRegister() {
  const [submitting, setSubmitting] = useState(false);

  // Rejects with a RegisterError the form can show inline.
  const register = async (input: RegisterInput): Promise<AuthResponse> => {
    setSubmitting(true);
    try {
      return await registerRequest(input);
    } catch (error) {
      throw toRegisterError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return { register, submitting };
}
