"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomState = void 0;
const game_1 = require("./interfaces/game");
const room_1 = require("./room");
class RoomState {
    constructor() {
        this.rooms = {};
    }
    addRoom(roomName) {
        if (!this.rooms[roomName]) {
            this.rooms[roomName] = new room_1.Room(roomName, game_1.GameType.MTGCommander);
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