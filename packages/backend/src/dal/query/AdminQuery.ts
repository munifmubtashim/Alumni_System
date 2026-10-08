import pool from "../config/db.js";

// GET /api/admin/stats. Counts are ints (COUNT(*) is bigint, which pg would send as a string).
export interface AdminStatsRow {
  alumni: number;
  students: number;
  posts: number;
  mentors: number;
}

// The six columns an admin edit writes (PUT /api/admin/alumni/:id): name and university on users,
// four on alumni. Everything else on the row (REQ-011 fields, bio, LinkedIn, photo, email, password,
// role, user_id) is never touched by an admin edit.
export interface AdminAlumniFields {
  name: string;
  university?: string;
  department?: string;
  graduation_year?: string;
  job_title?: string;
  current_company?: string;
}

// Posts by OTHER users that hold a comment the deleted user wrote, or a reply to one of their
// comments. The cascade removes those comments, so these posts' comment_count must be recounted.
// The user's own posts are left out: the cascade deletes them.
const AFFECTED_POSTS_SQL = `
  SELECT DISTINCT c.post_id FROM comments c
   WHERE (c.user_id = $1 OR c.parent_id IN (SELECT id FROM comments WHERE user_id = $1))
     AND c.post_id NOT IN (SELECT id FROM posts WHERE user_id = $1)`;

const RECOUNT_SQL = `
  UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id)
   WHERE id = ANY($1)`;

export class AdminQuery {
  // One round trip, four scalar sub-selects.
  public async countStats(): Promise<AdminStatsRow> {
    const info = await pool.query(
      `SELECT (SELECT COUNT(*) FROM alumni)::int AS alumni,
              (SELECT COUNT(*) FROM students)::int AS students,
              (SELECT COUNT(*) FROM posts)::int AS posts,
              (SELECT COUNT(*) FROM alumni WHERE mentorship_available = true)::int AS mentors`,
    );
    return info.rows[0];
  }

  // Updates the six admin-editable columns in one transaction. Returns false (and changes nothing)
  // if the alumni row doesn't exist.
  public async updateAlumniAccount(alumniId: number, fields: AdminAlumniFields): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const alumniResult = await client.query(
        `UPDATE alumni SET department=$1, graduation_year=$2, job_title=$3, current_company=$4, updated_at=NOW()
         WHERE id=$5 RETURNING user_id`,
        [
          fields.department ?? null,
          fields.graduation_year === undefined ? null : Number(fields.graduation_year),
          fields.job_title ?? null,
          fields.current_company ?? null,
          alumniId,
        ],
      );
      if (alumniResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }
      await client.query("UPDATE users SET name=$1, university=$2, updated_at=NOW() WHERE id=$3", [
        fields.name,
        fields.university ?? null,
        alumniResult.rows[0].user_id,
      ]);
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Deletes the user; ON DELETE CASCADE removes their alumni/students rows, posts (with those posts'
  // comments) and comments (with replies to them). Then recounts comment_count on other people's
  // posts that lost comments. One transaction: all or nothing. Returns false if no user had that id.
  public async deleteAlumniAccount(userId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Lock the user row first: comments.user_id references it, so a comment this user tries to
      // write from now on waits for this transaction (and then fails), and the affected-posts list
      // below can't miss it.
      const locked = await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
      if ((locked.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return false;
      }
      const affected = await client.query(AFFECTED_POSTS_SQL, [userId]);
      const postIds: number[] = affected.rows.map((row: { post_id: number }) => row.post_id);
      await client.query("DELETE FROM users WHERE id = $1", [userId]);
      if (postIds.length > 0) {
        await client.query(RECOUNT_SQL, [postIds]);
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
