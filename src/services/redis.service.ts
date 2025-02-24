import { RedisAnalytic } from "../domain/interfaces/iRedisAnalytic";
import { getAllRooms } from "../infrastructure/redis/redis";
import { IRedisService } from "./interfaces/iRedisService";

class RedisService implements IRedisService {
  constructor() {}

  async getCurrentRedisData(): Promise<RedisAnalytic> {
    const allRooms = await getAllRooms();
    
    const redisAnalytic: RedisAnalytic = {
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
