import { CommentDTO, CommentQuery } from "@alumni/dal";

export class CommentManager {
  commentQuery: CommentQuery;

  constructor() {
    this.commentQuery = new CommentQuery();
  }
  public async createComment(comment: CommentDTO) {
    const newComment = await this.commentQuery.createComment(comment);
    return newComment;
  }

  public async updateComment(comment: CommentDTO) {
    const newUpdateComment = await this.commentQuery.updateComments(comment);
    return newUpdateComment;
  }
  public async deleteComment(comment: CommentDTO) {
    const newDeleteComment = await this.commentQuery.deleteComments(comment);
    return newDeleteComment;
  }
  public async getAllComments() {
    const allComments = await this.commentQuery.getAllComments();
    return allComments;
  }
}