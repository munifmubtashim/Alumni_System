import { CommentDTO } from "./dto/CommentDTO.js";
import { PostDTO } from "./dto/PostDTO.js";
import { UserDTO } from "./dto/UserDTO.js";
import { CommentQuery } from "./query/CommentQuery.js";
import { PostQuery } from "./query/PostQuery.js";
import { UserQuery } from "./query/UserQuery.js";

const postQuery = new PostQuery();
const posts = await postQuery.getAllPosts();
console.log("The post are",JSON.stringify(posts,null,2));
// const post = new PostDTO(2,10,"Caption1","upload/image2.jpg");
// const newPost = postQuery.createPost(post);

// console.log(newPost);


// const commentQuery = new CommentQuery();
// const comment = new CommentDTO(1, 2, null, "Nice");
// const newComment = commentQuery.createComment(comment);
// console.log(newComment);


// const userQuery = new UserQuery();
// const data = new UserDTO("Munif Mubtashim","munifmubtashim@get.com","munif123@","Admin","upload/image.png");
// const newUser = userQuery.createUser(data);
// console.log(newUser);

