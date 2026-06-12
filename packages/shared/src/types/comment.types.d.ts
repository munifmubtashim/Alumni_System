export interface Comment {
    id: number;
    user_id: number;
    posts_id: number;
    parent_id?: number;
    content: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface CreateCommentInput {
    user_id: number;
    posts_id: number;
    parent_id?: number;
    content: string;
}
export interface UpdateCommentInput {
    content: string;
}
//# sourceMappingURL=comment.types.d.ts.map