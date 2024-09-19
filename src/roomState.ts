import { GameError, GameErrorType, GameType } from "./interfaces/game";
import { Room } from "./room";
import { plainToInstance } from 'class-transformer';
import {lockRoomAndGetState, saveRoomAndUnlock, deleteRoomAndUnlock} from './redis';
import { MTGCommander } from "./games/mtg-commander";

export class RoomState {
  // rooms: { [key: string]: Room };

  constructor() {
  }


  async getOrCreateRoom(roomName:string, roomId:string):Promise<Room> {
    let redisResult = await lockRoomAndGetState(roomId);
    let room = null;
    if(!redisResult.room){
      if(!roomName){
        throw new GameError(GameErrorType.GameNotStarted, "Room name required");
      }

      room = new Room(roomName, GameType.MTGCommander);
    }else{
      room = this.parseRoom(redisResult.room);  
    }

    room.redisLock = redisResult.lock;
    //console.log("Got Room: ", room)
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

    //console.log("Got Room: ", room)

    return room;
  }

  parseRoom(roomString:string):Room{
    let rawJSON = JSON.parse(roomString);
    let game = null;
    switch(rawJSON.game.gameType){
      case GameType.Game:
        console.error("GENERIC GAME OH NO!");
        break;
      case GameType.MTGCommander:
        game = new MTGCommander();
        break;
      
    }

    Object.assign(game,rawJSON.game);
    const room:Room = plainToInstance(Room, JSON.parse(roomString));
    room.game = game;

    return room;
  }


  async deleteRoom(room:Room) {
    // if (this.rooms[roomName]) {
    //   delete (this.rooms[roomName])
    // }
    await deleteRoomAndUnlock(room);
  }

}