import { PostDTO } from "@alumni/dal"
import { PostManager } from "./PostManager"

const manager = new PostManager()

const post = new PostDTO(1, 0, "Hello World", "https://image.com/photo.jpg")
manager.createNewPost(post)

const allPosts = manager.getAllPosts()

const postById = new PostDTO(1, 0)
manager.getPostsByUserId(postById)

const updatePost = new PostDTO(1, 0, "Updated Caption", "https://image.com/new.jpg")
updatePost.id = 1
manager.updatePost(updatePost)

const commentPost = new PostDTO(1, 5)
commentPost.id = 1
manager.updateCommentCount(commentPost)

const deletePost = new PostDTO(1, 0)
deletePost.id = 1
manager.deletePost(deletePost)