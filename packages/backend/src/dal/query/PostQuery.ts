import pool from "../../config/db.js";
import { PostDTO } from "../dto/PostDTO.js";



export class PostQuery {
    constructor() {
    }
    public async createPost(post: PostDTO): Promise<PostDTO> {
        const info = await pool.query(
            'INSERT INTO posts (user_id,caption,media_url,comment_count)VALUES ($1,$2,$3,$4) RETURNING * ',
            [
                post.user_id,
                post.caption,
                post.media_url,
                post.comment_count
            ]
        );
        return info.rows[0];
    }

    public async getAllPosts(): Promise<PostDTO[]> {
        const info = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        const posts:PostDTO[]=[];
        for(const post of info.rows){
            console.log(post);
          posts.push(post);
        }
        return posts;
    }

    public async getPostsByUserId(post: PostDTO): Promise<PostDTO[]> {
        const info = await pool.query(
            'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
            [
                post.user_id
            ]
        );
        return info.rows;
    }

    public async updatePost(post: PostDTO,fieldToUpdate: string[]): Promise<PostDTO> {
        const info = await pool.query(
            `UPDATE posts SET caption=$1, media_url=$2, updated_at=NOW()
            WHERE id=$3 RETURNING *`,
            [
                post.caption,
                post.media_url,
                post.id
            ]
        );
        return info.rows[0];
    }

    public async deletePost(post: PostDTO): Promise<void> {
        await pool.query(
            'DELETE FROM posts WHERE id = $1',
            [
                post.id
            ]
        );
    }

    public async updateCommentCount(post: PostDTO): Promise<void> {
        await pool.query(
            'UPDATE posts SET comment_count=$1 WHERE id=$2',
            [
                post.comment_count,
                post.id
            ]
        );

    }
}

