import { createUserDal , findUserByEmailDal } from "../dal/user.dal";
import {User,createUser} from "@alumni/shared";
import bcrypt from 'bcrypt';
import { register , login } from "../controllers/userController";


export async function registerUser(data:createUser): Promise<User>{
try{
    const existEmail = await findUserByEmailDal(data.email);
    if(existEmail){
           return res.status(400).json({ error: 'Email already exists' });
    }
        const hashpass  = await bcrypt.hash(data.password,10);
    if(!existEmail){
       const newUser = await createUserDal(data.name, data.email, hashpass, data.role);
       res.status(201).json(newUser);
    }
}catch(error:any){
    res.status(500).json({error: error.message});


}
}

export async function loginUser(req: Request , res:Response) {
    try{

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