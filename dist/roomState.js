"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomState = void 0;
const room_1 = require("./room");
class RoomState {
    constructor() {
        this.rooms = {};
    }
    addRoom(roomName) {
        if (!this.rooms[roomName]) {
            this.rooms[roomName] = new room_1.Room(roomName);
        }
    }
    deleteRoom(roomName) {
        if (this.rooms[roomName]) {
            delete (this.rooms[roomName]);
        }
    }
}
exports.RoomState = RoomState;
//# sourceMappingURL=roomState.js.map