import { GameType } from "./interfaces/game";
import { Room } from "./room";

export class RoomState {
  rooms: { [key: string]: Room };

  constructor() {
    this.rooms = {}
  }

  addRoom(roomName:string) {
    if (!this.rooms[roomName]) {
      this.rooms[roomName] = new Room(roomName, GameType.MTGCommander);
    }
  }

  deleteRoom(roomName:string) {
    if (this.rooms[roomName]) {
      delete (this.rooms[roomName])
    }
  }

}