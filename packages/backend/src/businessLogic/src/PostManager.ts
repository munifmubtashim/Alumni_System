import { PostDTO, PostQuery } from "@alumni/dal";

export class PostManager {
  postQuery: PostQuery;

  constructor() {
    this.postQuery = new PostQuery();
  }
  public async createNewPost(post: PostDTO) {
    const newPost = await this.postQuery.createPost(post);
    return newPost;
  }

  public async updatePost(post: PostDTO) {
    const newUpatePost = await this.postQuery.updatePost(post);
    return newUpatePost;
  }
  public async deletePost(post:PostDTO){
    const newDeletePOst = await this.postQuery.deletePost(post.id);
    return newDeletePOst;
  }
  public async getAllPosts(){
    const allPosts = await this.postQuery.getAllPosts();
    return allPosts;

  }
  public async getPostsByUserId(post:PostDTO){
    const  newPostById = await this.postQuery.getPostsByUserId(post.user_id);
    return newPostById;

  }
  public async updateCommentCount(post:PostDTO){
    const newCommentCount = await this.postQuery.updateCommentCount(post.id ,post.comment_count);
    return newCommentCount;
  }
}
