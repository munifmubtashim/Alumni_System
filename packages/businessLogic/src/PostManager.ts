import { PostDTO } from "../../backend/src/dal/dto/PostDTO";
import {PostQuery} from "../../backend/src/dal/query/PostQuery"



export class PostManager {
  public async createNewPost(
    user_id: number,
    caption: string,
    media_url: string,
    comments_count: number,
   
  ) {
    const postQuery = new PostQuery();
    const post = new PostDTO(
      user_id,
      comments_count,
      caption,
      media_url,
    );
    const newPost = postQuery.createPost(post);
    console.log(newPost);
  }



    
 public async updatePost(post:PostDTO){

 }
}