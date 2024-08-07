const Room = require("./room");

module.exports = class RoomState {

  constructor() {
    this.rooms = {}
  }

  addRoom(roomName) {
    if (!this.rooms[roomName]) {
      this.rooms[roomName] = new Room(roomName);
    }
  }

  deleteRoom(roomName) {
    if (this.rooms[roomName]) {
      delete (this.rooms[roomName])
    }
  }

}