const commentQuery = new CommentQuery();
const comment = new CommentDTO(1, 2, null, "Nice");
const newComment = commentQuery.createComment(comment);
console.log(newComment);