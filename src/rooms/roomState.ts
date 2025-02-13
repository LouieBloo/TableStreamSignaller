import { GameError, GameErrorSeverity, GameErrorType, GameType } from "../interfaces/game";
import { Room } from "./room";
import { plainToInstance } from 'class-transformer';
import {lockRoomAndGetState, getRoomUnsafe, deleteRoomAndUnlock} from '../redis';
import RoomService from '../mongo/services/room-service';

export interface ICreateRoomParams{
  roomId?:string;
  roomName:string;
  private?:boolean;
  password?:string;
  gameType:GameType;
  maxPlayers?:number;
  scheduledRoom?:boolean;
  initialScheduleTTLInSeconds?:number;
  reactionsEnabled?:boolean;
}

export class RoomState {

  constructor() {
  }

  async getOrCreateRoom(params:ICreateRoomParams):Promise<Room> {
    let redisResult = await lockRoomAndGetState(params.roomId);
    let room = null;
    if(!redisResult.room){
      if(!params.roomName){
        throw new GameError(GameErrorType.GameNotStarted, "Room name required",GameErrorSeverity.Error);
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

      //track in mongo
      await RoomService.addRoom(room);
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
    
    //track in mongo
    await RoomService.deleteRoom(room);
  }

}