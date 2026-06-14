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
}
