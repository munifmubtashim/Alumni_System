import { createUser , findUserByEmail  } from "../models/users";
import { Request , Response}  from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export async function register(req:Request , res:Response ){
try{
    const {name, email, password, role} = req.body;
    const existEmail = await findUserByEmail(email);
    if(existEmail){
           return res.status(400).json({ error: 'Email already exists' });
    }
        const hashpass  = await bcrypt.hash(password,10);
    if(!existEmail){
       const newUser = await createUser(name, email, hashpass, role);
       res.status(201).json(newUser);
    }
}catch(error:any){
    res.status(500).json({error: error.message});


}
};

export async function login(req: Request , res:Response) {
    try{
    const {email , password} = req.body;
     const userEmail = await findUserByEmail(email);
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