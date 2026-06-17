import pool from "../config/db.js";
import { CommentDTO } from "../dto/CommentDTO.js";

export class CommentQuery {
    constructor() {

    }
    public async createComment(comment: CommentDTO): Promise<CommentDTO> {
        const info = await pool.query(
            'INSERT INTO comments (user_id, post_id,parent_id,content)VALUES ($1,$2,$3,$4) RETURNING * ',
            [
                comment.user_id,
                comment.post_id,
                comment.parent_id,
                comment.content

            ]
        );
        return info.rows[0];
    }
    public async getAllComments(): Promise<CommentDTO[]> {
        const info = await pool.query(
            'SELECT * FROM comments ORDER BY created_at DESC'
        );
        const comments: CommentDTO[] = [];
        for (const comment of info.rows) {
            console.log(comment);
            comments.push(comment);
        }
        return comments;

    }

    public async updateComments(comment: CommentDTO): Promise<CommentDTO> {
        const info = await pool.query(
            `UPDATE comments SET content=$1, updated_at=NOW()
            WHERE id=$2 RETURNING *`,
            [

                comment.content,
                comment.id

            ]
        );
        return info.rows[0];
    }

    public async deleteComments(comment: CommentDTO): Promise<void> {
        await pool.query(
            'DELETE FROM comments WHERE id = $1',
            [
                comment.id
            ]
        );
    }
}