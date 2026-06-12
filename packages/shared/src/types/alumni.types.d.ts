export interface Alumni {
    id: number;
    user_id: number;
    graduation_year?: number;
    department?: string;
    current_company?: string;
    job_title?: string;
    experience?: string;
    bio?: string;
    linkedin_url?: string;
    updated_at?: Date;
}
export interface CreateAlumniInput {
    user_id: number;
    graduation_year?: number;
    department?: string;
    current_company?: string;
    job_title?: string;
    experience?: string;
    bio?: string;
    linkedin_url?: string;
}
export interface UpdateAlumniInput {
    graduation_year?: number;
    department?: string;
    current_company?: string;
    job_title?: string;
    experience?: string;
    bio?: string;
    linkedin_url?: string;
}
//# sourceMappingURL=alumni.types.d.ts.map