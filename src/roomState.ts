import { Room } from "./room";

export class RoomState {
  rooms: { [key: string]: Room };

  constructor() {
    this.rooms = {}
  }

  addRoom(roomName:string) {
    if (!this.rooms[roomName]) {
      this.rooms[roomName] = new Room(roomName);
    }
  }

  deleteRoom(roomName:string) {
    if (this.rooms[roomName]) {
      delete (this.rooms[roomName])
    }
  }

}