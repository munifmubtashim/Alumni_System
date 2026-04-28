export interface User{
    id:number;
    name:string;
    email:string;
    password:string;
    role: 'admin'|'alumni'|'student';
    photo_url:string;
    login_at: string;
    logout_at: string;
    created_at: string;
    updated_at: string;

}

export interface CreateUserInput{
    name:string;
    email:string;
    password:string;
    role: string;
}

export interface LoginUserInput{
    email:string;
    password:string;
}