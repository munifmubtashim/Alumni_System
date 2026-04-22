import { error } from "node:console";
import { createUser , findUserByEmail  } from "../models/users";
import { Request , Response}  from "express";

async function register(req:Request , res:Response ){
try{
    const {name, email, password, role} = req.body;
    const existEmail = await findUserByEmail(email);
    if(existEmail){
           return res.status(400).json({ error: 'Email already exists' });
    }
    else{
       const newUser = await createUser(name, email, password, role);
       res.status(201).json(newUser);
    }
}catch(error:any){
    res.status(500).json({error: error.message});


}
};