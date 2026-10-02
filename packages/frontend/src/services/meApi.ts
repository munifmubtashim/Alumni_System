import axios from "axios";
import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from "@alumni/shared";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getMyProfile(): Promise<MyProfile> {
  const res = await axios.get("/api/me", { headers: authHeaders() });
  return res.data;
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<MyProfile> {
  const res = await axios.put("/api/me", input, { headers: authHeaders() });
  return res.data;
}

export async function changeMyPassword(input: ChangePasswordInput): Promise<void> {
  await axios.put("/api/me/password", input, { headers: authHeaders() });
}
