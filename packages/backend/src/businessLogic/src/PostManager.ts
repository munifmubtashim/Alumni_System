import { PostDTO, PostQuery } from "@alumni/dal";
import { AppError } from "./errors.js";
import { requireId } from "./validation.js";

type Requester = { id: number; role: string };

export class PostManager {
  postQuery: PostQuery;

  constructor() {
    this.postQuery = new PostQuery();
  }

  // The author is always the authenticated user; a user_id in the body is never read.
  // Caption and media are text or null (400 otherwise), trimmed, blank stored as null.
  // A post needs one of them (BUG-001: an empty post crashed the feed).
  public async createNewPost(userId: number, body: Record<string, unknown>) {
    const caption = blankToNull(readText(body, "caption"));
    const mediaUrl = blankToNull(readText(body, "media_url"));
    requireContent(caption, mediaUrl);
    const post = new PostDTO(userId, 0, caption, mediaUrl);
    return this.postQuery.createPost(post);
  }

  // Only the post's author or an admin may edit it. The author stays the same.
  // Ownership is checked before the body, so a non-owner never sees validation errors.
  // Only the fields sent change (AC14): omitted keeps, null clears, text is stored as sent.
  // The edit may not leave the post with neither caption nor media.
  public async updatePost(requester: Requester, postId: unknown, body: Record<string, unknown>) {
    const existing = await this.findOwnedPost(requester, postId);
    const patch: { caption?: string | null; media_url?: string | null } = {};
    for (const key of ["caption", "media_url"] as const) {
      const value = readText(body, key);
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length === 0) throw new AppError(400, "Nothing to update");
    const merged = { ...existing, ...patch };
    requireContent(merged.caption, merged.media_url);
    return this.postQuery.updatePost(existing.id, patch);
  }

  // Only the post's author or an admin may delete it.
  public async deletePost(requester: Requester, postId: unknown) {
    const existing = await this.findOwnedPost(requester, postId);
    await this.postQuery.deletePost(existing.id);
  }

  public async getAllPosts(limit?: number, offset?: number) {
    return this.postQuery.getAllPosts(limit, offset);
  }

  public async getPostsByUserId(userId: unknown) {
    return this.postQuery.getPostsByUserId(requireId(userId, "User"));
  }

  public async updateCommentCount(post: PostDTO) {
    return this.postQuery.updateCommentCount(post.id, post.comment_count);
  }

  private async findOwnedPost(requester: Requester, postId: unknown): Promise<PostDTO> {
    const id = requireId(postId, "Post");
    const post = await this.postQuery.findPostById(id);
    if (!post) throw new AppError(404, "Post not found");
    if (post.user_id !== requester.id && requester.role !== "admin") {
      throw new AppError(403, "You can only change your own posts");
    }
    return post;
  }
}

// undefined when the key is absent; text or null when sent; anything else is a 400.
function readText(body: Record<string, unknown>, key: "caption" | "media_url"): string | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, key)) return undefined;
  const value = body[key];
  if (value !== null && typeof value !== "string") {
    throw new AppError(400, `${key === "caption" ? "Caption" : "Media URL"} must be text or null`);
  }
  return value;
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim() !== "";
}

function requireContent(caption: string | null | undefined, mediaUrl: string | null | undefined) {
  if (!hasText(caption) && !hasText(mediaUrl)) throw new AppError(400, "A post needs a caption or media");
}
