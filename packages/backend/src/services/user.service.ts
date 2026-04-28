import { createUserDal , findUserByEmailDal } from "../dal/user.dal";
import {User,CreateUserInput,LoginUserInput} from "@alumni/shared";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



export async function registerUser(data:CreateUserInput): Promise<User>{
    const existEmail = await findUserByEmailDal(data.email);
    if(existEmail){
           throw new Error('Email already exists')
    }
        const hashpass  = await bcrypt.hash(data.password,10);
       return await createUserDal({name: data.name, email: data.email, password: hashpass, role: data.role});
       
    
}

export async function loginUser(data:LoginUserInput) {
    
    const emailCheck = await findUserByEmailDal(data.email);

     if(!emailCheck){
           throw new Error( 'Email not found');

     }
    const passCompare = await bcrypt.compare(data.password, emailCheck.password)
     if(!passCompare){
      throw new Error('Wrong password');
     }
     else{
        return  jwt.sign({id: emailCheck.id , role: emailCheck.role},process.env.SECRET!,{expiresIn: '1h'});
     }
    
}