import { CommentDTO, CommentQuery } from "@alumni/dal";
import { AppError } from "./errors.js";
import { requireId, requiredText } from "./validation.js";

export class CommentManager {
  commentQuery: CommentQuery;

  constructor() {
    this.commentQuery = new CommentQuery();
  }

  public async getCommentsForPost(postId: unknown) {
    return this.commentQuery.getCommentsByPost(requireId(postId, "Post"));
  }

  // The author is always the authenticated user; nothing in the body can change that.
  // `parent_id` makes it a reply; threads are one level deep, so a reply to a reply
  // is attached to the top-level comment.
  public async addComment(userId: number, postId: unknown, body: Record<string, unknown>) {
    const id = requireId(postId, "Post");
    const content = requiredText(body.content, "Comment", 2000);
    let parentId: number | null = null;
    if (body.parent_id !== undefined && body.parent_id !== null) {
      const parent = await this.commentQuery.findCommentById(requireId(body.parent_id, "Comment"));
      if (!parent) throw new AppError(404, "Comment not found");
      if (parent.post_id !== id) throw new AppError(400, "You can only reply to a comment on the same post");
      parentId = parent.parent_id ?? parent.id;
    }
    try {
      return await this.commentQuery.createComment(new CommentDTO(userId, id, content, parentId));
    } catch (error) {
      // comments_post_id_fkey: the post doesn't exist
      if ((error as { code?: string }).code === "23503") throw new AppError(404, "Post not found");
      throw error;
    }
  }

  // Only the comment's author or an admin may edit it, and only its text: the author,
  // post and parent stay. Ownership is checked before the body, so a non-owner never
  // sees validation errors.
  public async updateComment(requester: { id: number; role: string }, commentId: unknown, body: Record<string, unknown>) {
    const id = requireId(commentId, "Comment");
    const comment = await this.commentQuery.findCommentById(id);
    if (!comment) throw new AppError(404, "Comment not found");
    if (comment.user_id !== requester.id && requester.role !== "admin") {
      throw new AppError(403, "You can only change your own comments");
    }
    const content = requiredText(body.content, "Comment", 2000);
    const updated = await this.commentQuery.updateComment(id, content);
    // Deleted between the lookup and the update.
    if (!updated) throw new AppError(404, "Comment not found");
    return updated;
  }

  // Only the comment's author or an admin may delete it.
  public async deleteComment(requester: { id: number; role: string }, commentId: unknown) {
    const id = requireId(commentId, "Comment");
    const comment = await this.commentQuery.findCommentById(id);
    if (!comment) throw new AppError(404, "Comment not found");
    if (comment.user_id !== requester.id && requester.role !== "admin") {
      throw new AppError(403, "You can only delete your own comments");
    }
    await this.commentQuery.deleteComment(id, comment.post_id);
  }
}
