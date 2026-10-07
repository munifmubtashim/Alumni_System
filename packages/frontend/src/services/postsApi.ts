import type { Comment, CreateCommentInput, Post, UpdateCommentInput } from '@alumni/shared';
import { httpClient } from './httpClient';

// GET /api/posts paging. The API clamps limit to 1..100 (default 50) and offset
// to 0 or more; the page size is the caller's choice.
export interface ListPostsParams {
  limit: number;
  offset: number;
}

// Body of POST /api/posts and PUT /api/posts/:id. The author comes from the
// token, never the body.
export interface PostInput {
  caption: string;
}

// One path segment from an id. Ids are numbers today, but encoding keeps a
// stray "/" or "?" from ever changing which endpoint is called.
function segment(id: number): string {
  return encodeURIComponent(String(id));
}

// GET /api/posts, newest first, with author_name and author_photo joined in.
export async function listPosts(params: ListPostsParams): Promise<Post[]> {
  const res = await httpClient.get<Post[]>('/posts', {
    params: { limit: params.limit, offset: params.offset },
  });
  return res.data;
}

// POST /api/posts. Answers 201 with the bare row (no author fields).
export async function createPost(input: PostInput): Promise<Post> {
  const res = await httpClient.post<Post>('/posts', input);
  return res.data;
}

// PUT /api/posts/:id. Owner or admin.
export async function updatePost(id: number, input: PostInput): Promise<Post> {
  const res = await httpClient.put<Post>(`/posts/${segment(id)}`, input);
  return res.data;
}

// DELETE /api/posts/:id. Owner or admin. The API answers 200 with a message,
// which nothing reads.
export async function deletePost(id: number): Promise<void> {
  await httpClient.delete(`/posts/${segment(id)}`);
}

// GET /api/posts/:id/comments, with author fields joined in.
export async function listComments(postId: number): Promise<Comment[]> {
  const res = await httpClient.get<Comment[]>(`/posts/${segment(postId)}/comments`);
  return res.data;
}

// POST /api/posts/:id/comments. parent_id makes it a reply (one level deep).
export async function createComment(postId: number, input: CreateCommentInput): Promise<Comment> {
  const res = await httpClient.post<Comment>(`/posts/${segment(postId)}/comments`, input);
  return res.data;
}

// PUT /api/comments/:id. Owner or admin; only the text changes. Returns the
// comment with its author fields.
export async function updateComment(id: number, input: UpdateCommentInput): Promise<Comment> {
  const res = await httpClient.put<Comment>(`/comments/${segment(id)}`, input);
  return res.data;
}

// DELETE /api/comments/:id. Owner or admin; the message body is ignored.
export async function deleteComment(id: number): Promise<void> {
  await httpClient.delete(`/comments/${segment(id)}`);
}
