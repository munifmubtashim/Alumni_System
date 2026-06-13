import type { BaseDTO } from "./BaseDTO";
export class AlumniDTO implements BaseDTO {
    id!: number;
    user_id: number;
    graduation_yr?: number;
    department: string;
    current_company?: string;
    job_title?: string;
    experience?: string;
    bio?: string;
    linkedin_url?: string;
    created_at: Date;
    updated_at: Date;

    constructor(id: number, user_id: number, department: string, graduation_yr?: number, current_company?: string, job_title?: string, experience?: string, bio?: string, linkedin_url?: string) {
        this.user_id = user_id;
        this.graduation_yr = graduation_yr;
        this.department = department;
        this.current_company = current_company;
        this.job_title = job_title;
        this.experience = experience;
        this.bio = bio;
        this.linkedin_url = linkedin_url;
        const now = new Date();
        this.created_at = now;
        this.updated_at = now;

    }



}