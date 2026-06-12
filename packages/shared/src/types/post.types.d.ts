export interface Post {
    id: number;
    user_id: number;
    caption?: string;
    media_url?: string;
    comment_count?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface CreatePostInput {
    user_id: number;
    caption?: string;
    media_url?: string;
}
export interface UpdatePostInput {
    caption?: string;
    media_url?: string;
}
//# sourceMappingURL=post.types.d.ts.map