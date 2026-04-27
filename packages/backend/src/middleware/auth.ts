import jwt from 'jsonwebtoken';
import { Request,Response , NextFunction  } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export async function protect(req:Request,res:Response,next:NextFunction) {
    try{
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){
        res.status(401).json({error:'Unauthorized Error '});
    }
    
    if(token){
        const verify = jwt.verify(token,process.env.SECRET!);
        req.user = verify as JwtPayload;
        next();
    }
    }
    catch(error:any)
    {
     res.status(500).json({error: error.message});
    };
    

}