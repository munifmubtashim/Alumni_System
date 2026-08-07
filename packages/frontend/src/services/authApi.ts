import axios from "axios";

export async function login(email: string, password: string) {
  const res = await axios.post("http://localhost:3000/api/auth/login", { email, password });
  return res.data;
}