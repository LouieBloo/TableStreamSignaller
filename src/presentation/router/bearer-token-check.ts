import express, { Request, Response, NextFunction } from 'express';
import MongoUser from '../../infrastructure/mongo/models/user-model';

export const checkBearerToken = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Find the user with the provided developerToken
    const user = await MongoUser.findOne({ developerToken: token });

    if (!user) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

    // Attach the user to the request object
    req.user = user;

    next();
  } catch (error) {
    console.error('Error in checkBearerToken middleware:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};