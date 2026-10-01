import axios from "axios";
import type { Post } from "@alumni/shared";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getPosts(limit: number, offset: number): Promise<Post[]> {
  const res = await axios.get("/api/posts", { params: { limit, offset } });
  return res.data;
}

export async function getPostsByUser(userId: number): Promise<Post[]> {
  const res = await axios.get(`/api/posts/user/${userId}`);
  return res.data;
}

// TODO(security bolt): the server should take user_id from the JWT instead of the body.
export async function createPost(user_id: number, caption: string, media_url?: string): Promise<Post> {
  const res = await axios.post("/api/posts", { user_id, caption, media_url }, { headers: authHeaders() });
  return res.data;
}

export async function updatePost(id: number, caption: string, media_url?: string): Promise<Post> {
  const res = await axios.put(`/api/posts/${id}`, { caption, media_url }, { headers: authHeaders() });
  return res.data;
}

export async function deletePost(id: number): Promise<void> {
  await axios.delete(`/api/posts/${id}`, { headers: authHeaders() });
}
