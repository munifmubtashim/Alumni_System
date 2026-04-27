
import { Request , Response}  from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUserDal, findUserByEmailDal } from "../dal/user.dal";



export async function register(req:Request , res:Response ){
try{
    const {name, email, password, role} = req.body;


}catch(error:any){
    res.status(500).json({error: error.message});


}
}

export async function login(req: Request , res:Response) {
    try{
    const {email , password} = req.body;
     const userEmail = await findUserByEmailDal(email);
     if(!userEmail){
         return res.status(404).json({error: 'Email not found'});

     }
    const passCompare = await bcrypt.compare(password, userEmail.password)
     if(!passCompare){
      return res.status(401).json({error: 'Wrong password'});
     }
     else{
        const token = jwt.sign({id: userEmail.id , role: userEmail.role},process.env.SECRET!,{expiresIn: '1h'});
        return res.status(200).json({message: 'Login Successful', token});
     }
    }
    catch(error:any){
    res.status(500).json({error: error.message});
    }
    
}



