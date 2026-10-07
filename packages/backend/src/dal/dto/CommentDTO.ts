import type  { BaseDTO } from "./BaseDTO";

export class CommentDTO implements BaseDTO {
    id!: number;
    user_id: number;
    post_id: number;
    parent_id: number | null;
    content: string;
    created_at: Date;
    updated_at: Date;
    // Joined from users on reads.
    author_name?: string;
    author_photo?: string;

    constructor(user_id: number, post_id: number, content: string, parent_id: number | null = null) {
        this.user_id = user_id;
        this.post_id = post_id;
        this.parent_id = parent_id;
        this.content = content;
        const now = new Date();
        this.created_at = now;
        this.updated_at = now;
    }
}
