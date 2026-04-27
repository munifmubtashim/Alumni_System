export interface User{
    id:number,
    name:string,
    email:string,
    password:string,
    role: 'admin'|'alumni'|'student',
    photo_url:string,
    created_at:string

}

export interface createUser{
    name:string,
    email:string,
    password:string,
    role: string
}