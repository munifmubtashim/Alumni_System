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
  // Caption and media pass through unchanged (no content rules, see REQ-003 non-goals).
  public async createNewPost(userId: number, body: Record<string, unknown>) {
    const post = new PostDTO(userId, 0, body.caption as string | undefined, body.media_url as string | undefined);
    return this.postQuery.createPost(post);
  }

  // Only the post's author or an admin may edit it. The author stays the same.
  public async updatePost(requester: Requester, postId: unknown, body: Record<string, unknown>) {
    const existing = await this.findOwnedPost(requester, postId);
    const post = new PostDTO(
      existing.user_id,
      existing.comment_count,
      body.caption as string | undefined,
      body.media_url as string | undefined,
    );
    post.id = existing.id;
    return this.postQuery.updatePost(post);
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
