import pool from "../config/db.js";
import { PostDTO } from "../dto/PostDTO.js";

// The post columns an edit may change.
const POST_PATCH_COLUMNS = ["caption", "media_url"] as const;
export type PostPatch = { caption?: string | null; media_url?: string | null };

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
            `SELECT posts.*, users.name AS author_name, users.photo_url AS author_photo
             FROM posts
             JOIN users ON posts.user_id = users.id
             WHERE posts.user_id = $1
             ORDER BY posts.created_at DESC`,
            [
                user_id
            ]
        );
        return info.rows;
    }

    public async findPostById(id: number): Promise<PostDTO | undefined> {
        const info = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
        return info.rows[0];
    }

    // Sets only the columns present in the patch (AC14); omitted ones keep their value.
    // Column names come from a fixed allowlist and values are parameters. Never sets
    // user_id: an admin editing someone's post keeps the original author.
    public async updatePost(id: number, patch: PostPatch): Promise<PostDTO> {
        const sets: string[] = [];
        const params: unknown[] = [];
        for (const column of POST_PATCH_COLUMNS) {
            if (Object.prototype.hasOwnProperty.call(patch, column)) {
                params.push(patch[column]);
                sets.push(`${column}=$${params.length}`);
            }
        }
        params.push(id);
        const info = await pool.query(
            `UPDATE posts SET ${[...sets, 'updated_at=NOW()'].join(', ')}
            WHERE id=$${params.length} RETURNING *`,
            params
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

