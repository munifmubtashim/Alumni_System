import pool from "../config/db.js";
import { CommentDTO } from "../dto/CommentDTO.js";

// Comment row + public author fields (never the password). author_alumni_id is the
// author's alumni.id for the /alumni/:id link, null without an alumni row; a scalar
// subquery (lowest id, as findAlumniByUserId) so rows are never duplicated.
const COMMENT_COLUMNS = `c.*, u.name AS author_name, u.photo_url AS author_photo,
         (SELECT MIN(a.id) FROM alumni a WHERE a.user_id = c.user_id) AS author_alumni_id`;

export class CommentQuery {
    constructor() {

    }

    public async getCommentsByPost(postId: number): Promise<CommentDTO[]> {
        const info = await pool.query(
            `SELECT ${COMMENT_COLUMNS}
             FROM comments c JOIN users u ON u.id = c.user_id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC, c.id ASC`,
            [postId]
        );
        return info.rows;
    }

    public async findCommentById(id: number): Promise<CommentDTO | undefined> {
        const info = await pool.query('SELECT * FROM comments WHERE id = $1', [id]);
        return info.rows[0];
    }

    // Changes only the text and updated_at; user_id, post_id and parent_id never change.
    // One statement, so a comment deleted since the caller's lookup gives no row (undefined),
    // never an empty body. The result has the same author fields as the list rows.
    public async updateComment(id: number, content: string): Promise<CommentDTO | undefined> {
        const info = await pool.query(
            `WITH c AS (
                UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *
             )
             SELECT ${COMMENT_COLUMNS} FROM c JOIN users u ON u.id = c.user_id`,
            [content, id]
        );
        return info.rows[0];
    }

    // Inserts the comment and recounts posts.comment_count in one transaction.
    public async createComment(comment: CommentDTO): Promise<CommentDTO> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const inserted = await client.query(
                'INSERT INTO comments (user_id, post_id, parent_id, content) VALUES ($1, $2, $3, $4) RETURNING id',
                [comment.user_id, comment.post_id, comment.parent_id, comment.content]
            );
            await client.query(
                'UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = $1) WHERE id = $1',
                [comment.post_id]
            );
            const row = await client.query(
                `SELECT ${COMMENT_COLUMNS} FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
                [inserted.rows[0].id]
            );
            await client.query('COMMIT');
            return row.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Deletes the comment (replies cascade) and recounts posts.comment_count in one transaction.
    public async deleteComment(id: number, postId: number): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM comments WHERE id = $1', [id]);
            await client.query(
                'UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = $1) WHERE id = $1',
                [postId]
            );
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
