import axios from "axios";
import type { Comment, CreateCommentInput } from "@alumni/shared";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function getComments(postId: number): Promise<Comment[]> {
  const res = await axios.get(`/api/posts/${postId}/comments`);
  return res.data;
}

export async function addComment(postId: number, input: CreateCommentInput): Promise<Comment> {
  const res = await axios.post(`/api/posts/${postId}/comments`, input, { headers: authHeaders() });
  return res.data;
}

export async function deleteComment(id: number): Promise<void> {
  await axios.delete(`/api/comments/${id}`, { headers: authHeaders() });
}
