import express, { Request, Response, NextFunction } from 'express';

export const checkBearerToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
  
    const token = authHeader.split(' ')[1];
  
    // Replace this with your token validation logic
    if (token !== process.env.DEV_CLASSIFIED_KEY) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  
    next(); // Proceed to the next middleware or route handler
};