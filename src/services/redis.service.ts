import { Room } from "../domain/rooms/room";
import { RedisAnalytic } from "../domain/interfaces/iRedisAnalytic";
import { IRedisService } from "./interfaces/iRedisService";
import { IRedisRepository } from "./interfaces/iRedisRepository";
import { ICreateRoomParams } from "../domain/interfaces/create-room-params";

export class RedisService implements IRedisService {
  private _redisRepository: IRedisRepository;
  constructor(IRedisRepository: IRedisRepository) {
    this._redisRepository = IRedisRepository;
  }

  async getRedisAnalytic(): Promise<RedisAnalytic> {
    const allRooms = await this._redisRepository.getAllRooms();

    const redisAnalytic: RedisAnalytic = {
      activePlayers: this.getActivePlayers(allRooms),
      activeRooms: allRooms.length,
    };

    return redisAnalytic;
  }

  async getRoom(roomId: string): Promise<Room> {
    return await this._redisRepository.lockRoomAndGetState(roomId);
  }

  async isRoomPasswordProtected(roomId: string) {
    return await this._redisRepository.isRoomPasswordProtected(roomId);
  }

  async getRoomUnsafe(roomId: string): Promise<Room | null> {
    return await this._redisRepository.getRoomUnsafe(roomId);
  }

  async deleteRoom(room: Room) {
    try {
      await this._redisRepository.deleteRoomAndUnlock(room);
    } catch (error) {
      console.log("Error deleting room: ", error);
    }
  }

  async getOrCreateRoom(params: ICreateRoomParams): Promise<Room> {

    let room = await this._redisRepository.lockRoomAndGetState(params.roomId);
    if (!room) {
      room = new Room(params);
      //track in mongo //doublecheck that this gets called elsewhere TODO
      // await this._mongoService.addRoom(room);
    }

    return room;
  }

   async saveAndClose(room: Room, setScheduledTTL:boolean = false) {
    try{
      await this._redisRepository.saveRoomAndUnlock(room,setScheduledTTL);
    }catch(error){
      console.log("Error saving and closing room: ", error)
    }
  }

  async close(room: Room) {
    try {
      await this._redisRepository.unlockRoom(room.redisLock);
    }catch(error){
      console.log("Error unlocking room: ", error)
    }

  }

  private getActivePlayers(rooms: any[]) {
    let totalActivePlayers = 0;
    for (const room of rooms) {
      totalActivePlayers += room.players.length || 0;
    }
    return totalActivePlayers;
  }
}
