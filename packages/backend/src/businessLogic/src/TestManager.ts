import { PostDTO } from "@alumni/dal"
import { PostManager } from "./PostManager"

const manager = new PostManager()
const post = new PostDTO(1, 0, "Hello World", "https://image.com/photo.jpg")

manager.createNewPost(post)