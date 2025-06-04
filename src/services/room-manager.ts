import { GameError, GameErrorSeverity, GameErrorType } from "../domain/interfaces/IGame";
import { plainToInstance } from 'class-transformer';
import {lockRoomAndGetState, getRoomUnsafe, deleteRoomAndUnlock} from '../infrastructure/redis/redis';
import { ICreateRoomParams } from "../domain/interfaces/ICreateRoomParams";
import { addRoom, deleteRoom } from "../infrastructure/mongo/mongo-repository";
import { Room } from "../domain/rooms/room";
import { getUserIdFromToken } from '../domain/users/services/user-service';

//getOrCreateRoom can move all the if statements to the Room obj
//update redis.ts so it returns a Room or null, not a string + a lock
//move parseroom to redis.ts

class RoomManager {

  async getOrCreateRoom(params:ICreateRoomParams):Promise<Room> {
    let redisResult = await lockRoomAndGetState(params.roomId);
    let room = null;
    if(!redisResult.room){
      if(!params.roomName){
        throw new GameError(GameErrorType.GameNotStarted, "Room name required",GameErrorSeverity.Error);
      }

      if(params.public){
        const creatorUserId:string | null  = await getUserIdFromToken(params.creatorJwtToken);
        if(!creatorUserId){
          throw new GameError(GameErrorType.InvalidAction, "You must be logged in to create public games", GameErrorSeverity.Error);
        }
      }

      //create new room
      room = new Room(params.roomName, params.password, params.gameType, params.maxPlayers);
      //manually assign these as they arent common
      if(params.scheduledRoom){
        room.scheduledRoom = params.scheduledRoom;
      }
      if(params.initialScheduleTTLInSeconds > 0){
        room.initialScheduleTTLInSeconds = params.initialScheduleTTLInSeconds;
      }
      //auto create password if the room is private and no password was given
      if(params.private && !params.password){
        room.password = room.generateRandomPassword(10);
      }
      if(params.reactionsEnabled == false){
        room.reactionsEnabled = false;
      }
      if(params.allowPlayerKicking == false){
        room.allowPlayerKicking = false;
      }
      if(params.public != undefined && params.public != null){
        room.public = params.public;
      }

      //track in mongo
      await addRoom(room);
    }else{
      room = this.parseRoom(redisResult.room);  
    }

    room.redisLock = redisResult.lock;

    return room;
  }

  async getRoom(roomId:string):Promise<Room> {
    let redisResult = await lockRoomAndGetState(roomId);
    let rawRoom = redisResult.room;
    if(!rawRoom){
      return null;
    }

    let room:Room = this.parseRoom(rawRoom);
    room.redisLock = redisResult.lock;

    return room;
  }

  async getRoomUnsafe(roomId:string):Promise<Room> {
    let redisResult = await getRoomUnsafe(roomId);
    let rawRoom = redisResult.room;
    if(!rawRoom){
      return null;
    }

    let room:Room = this.parseRoom(rawRoom);
    return room;
  }

  parseRoom(roomString:string):Room{
    let rawJSON = JSON.parse(roomString);

    let game = Room.createGame(rawJSON.game.gameType);

    Object.assign(game,rawJSON.game);
    const room:Room = plainToInstance(Room, JSON.parse(roomString));
    room.game = game;

    return room;
  }

  async deleteRoom(room:Room) {
    try{
      await deleteRoomAndUnlock(room);
    }catch(error){
      console.log("catching delete room: ", error);
    }

    await deleteRoom(room);
  }

}

export default new RoomManager()