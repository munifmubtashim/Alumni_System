import type { BaseDTO } from "./BaseDTO";
export declare class PostDTO implements BaseDTO {
    id: number;
    user_id: number;
    caption?: string;
    media_url?: string;
    comment_count: number;
    created_at?: Date;
    updated_at?: Date;
    constructor(user_id: number, comment_count: number, caption?: string, media_url?: string);
}
//# sourceMappingURL=PostDTO.d.ts.map