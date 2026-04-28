import {CreateUserInput} from "@alumni/shared";
import { Request , Response}  from "express";
import bcrypt from 'bcrypt';
import { createUserDal, findUserByEmailDal } from "../dal/user.dal";
import { loginUser, registerUser } from "../services/user.service";



export async function register(req:Request , res:Response ){
try{
    const data:CreateUserInput = req.body;
    const newUser = await registerUser(data);
    res.status(201).json(newUser);

}catch(error:any){
    res.status(500).json({error: error.message});


}
}

export async function login(req: Request , res:Response) {
    try{
  
    }
    catch(error:any){
    res.status(500).json({error: error.message});
    }
    
}



