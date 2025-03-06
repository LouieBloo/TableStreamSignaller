import { IRedisAnalytic } from "../domain/interfaces/IRedisAnalytic";
import { getAllRooms } from "../infrastructure/redis/redis";
import { IRedisService } from "./interfaces/IRedisService";

class RedisService implements IRedisService {
  constructor() {}

  async getCurrentRedisData(): Promise<IRedisAnalytic> {
    const allRooms = await getAllRooms();
    
    const redisAnalytic: IRedisAnalytic = {
      activePlayers: this.getActivePlayers(allRooms),
      activeRooms: allRooms.length
    }

    return redisAnalytic;
  }

  private getActivePlayers(rooms: any[]){
    let totalActivePlayers = 0;
    for (const room of rooms) {
      totalActivePlayers += room.players.length || 0;
    }
    return totalActivePlayers
  }
  
}

export default new RedisService();
