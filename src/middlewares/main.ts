import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express';
import * as dotenv from "dotenv";

dotenv.config();

export function handleError (error, req,res,next) {
    res.status(error.statusCode || 500).send({message: error.message})

}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized - No token provided" 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    req.user = decoded;
    next();
  } catch (error) {
    let message = "Unauthorized - Invalid token";
    
    if (error instanceof jwt.TokenExpiredError) {
      message = "Unauthorized - Token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = "Unauthorized - Token verification failed";
    }
    
    return res.status(401).json({ 
      success: false, 
      message 
    });
  }
};