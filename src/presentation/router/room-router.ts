import { Router, Request, Response, NextFunction } from 'express';
import { apiError } from './services/router-error-service';

import { IAPIError } from './interfaces/IAPIError';
import { getAllRooms } from '../../infrastructure/redis/redis';
import { IRoom } from './interfaces/IRoom';
import { authenticateToken } from './user-router';

const router = Router();

router.get('/', async(req: any, res: any) => {
//   const allRooms:any[] = await getAllRooms({public: true, hasEmptySpots: true});
  const allRooms:any[] = await getAllRooms();

  let parsedRooms:IRoom[] = allRooms.map((room:any)=>{
    return { 
        id: room.id,
        name: room.name,
        gameType: room.game?.gameType,
        passwordProtected: room.password ? true : false,
        maxPlayers: room.maxPlayers,
        currentPlayers: room.players.length,
        reactionsEnabled: room.reactionsEnabled
    }
  })

  return res.json({ rooms: parsedRooms})
})


export default router;