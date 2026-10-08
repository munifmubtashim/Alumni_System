export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  parent_id?: number | null;
  content: string;
  created_at?: Date;
  updated_at?: Date;
  // Joined from users on reads.
  author_name?: string;
  author_photo?: string;
  // The author's alumni.id (what /alumni/:id takes), null when they have no alumni profile.
  author_alumni_id?: number | null;
}

// POST /api/posts/:id/comments — the author comes from the JWT, not the body.
// `parent_id` makes it a reply (threads are one level deep).
export interface CreateCommentInput {
  content: string;
  parent_id?: number;
}

// PUT /api/comments/:id — owner or admin; only the text changes (author, post and parent stay).
export interface UpdateCommentInput {
  content: string;
}
