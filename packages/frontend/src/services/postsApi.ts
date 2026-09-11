import axios from "axios";
import type { Post } from "@alumni/shared";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function createPost(caption: string, media_url?: string): Promise<Post> {
  const res = await axios.post(
    "http://localhost:3000/api/posts",
    { caption, media_url },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function updatePost(id: number, caption: string, media_url?: string): Promise<Post> {
  const res = await axios.put(
    `http://localhost:3000/api/posts/${id}`,
    { caption, media_url },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function deletePost(id: number): Promise<void> {
  await axios.delete(`http://localhost:3000/api/posts/${id}`, {
    headers: authHeaders(),
  });
}