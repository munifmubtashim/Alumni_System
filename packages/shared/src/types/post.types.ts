export interface Post {
  id: number;
  user_id: number;
  // Nullable columns: the API sends SQL NULL as JSON null, so guard null as well as missing.
  caption?: string | null;
  media_url?: string | null;
  comment_count?: number;
  created_at?: Date;
  updated_at?: Date;
  author_name?: string;
  author_photo?: string;
  // The author's alumni.id (what /alumni/:id takes), null when they have no alumni profile.
  author_alumni_id?: number | null;
}