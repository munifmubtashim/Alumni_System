import type  { BaseDTO } from "./BaseDTO";


export class PostDTO implements BaseDTO {
    id: number;
    user_id: number;
    caption?: string;
    media_url?: string;
    comment_count: number;
    created_at: Date;
    updated_at: Date;


    constructor(user_id: number, comment_count: number, caption?: string, media_url?: string) {
        this.user_id = user_id;
        this.caption = caption;
        this.media_url = media_url;
        this.comment_count = comment_count;
        const now = new Date();
        this.created_at = now;
        this.updated_at = now;
    }





}