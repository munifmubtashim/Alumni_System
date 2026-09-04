import pool from "../config/db.js";
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

public async getAllPosts(limit: number = 50, offset: number = 0): Promise<PostDTO[]> {
    const info = await pool.query(
        `SELECT posts.*, users.name AS author_name, users.photo_url AS author_photo
         FROM posts
         JOIN users ON posts.user_id = users.id
         ORDER BY posts.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    return info.rows;
}

    public async getPostsByUserId(user_id: number): Promise<PostDTO[]> {
        const info = await pool.query(
            'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
            [
                user_id
            ]
        );
        return info.rows;
    }

    public async updatePost(post: PostDTO): Promise<PostDTO> {
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

    public async deletePost(id: number): Promise<void> {
        await pool.query(
            'DELETE FROM posts WHERE id = $1',
            [
                id
            ]
        );
    }

    public async updateCommentCount(id: number, comment_count: number): Promise<void> {
        await pool.query(
            'UPDATE posts SET comment_count=$1 WHERE id=$2',
            [
                comment_count,
                id
            ]
        );

    }
}

