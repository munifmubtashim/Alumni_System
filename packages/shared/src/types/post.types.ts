export interface Post {
  id: number;
  user_id: number;
  caption?: string;
  media_url?: string;
  comment_count?: number;
  created_at?: Date;
  updated_at?: Date;
  author_name?: string;
  author_photo?: string;
  // The author's alumni.id (what /alumni/:id takes), null when they have no alumni profile.
  author_alumni_id?: number | null;
}