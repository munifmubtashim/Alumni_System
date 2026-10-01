import axios from "axios";
import type { Alumni } from "@alumni/shared";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getAlumni(): Promise<Alumni[]> {
  const res = await axios.get("/api/alumni");
  return res.data;
}

// Requires a JWT; includes the alumnus' email.
export async function getAlumniById(id: number): Promise<Alumni> {
  const res = await axios.get(`/api/alumni/${id}`, { headers: authHeaders() });
  return res.data;
}
