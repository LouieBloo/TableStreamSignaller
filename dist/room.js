"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const player_1 = require("./player");
class Room {
    constructor(roomName) {
        this.name = roomName;
        this.messages = [];
        this.players = [];
    }
    addPlayer(playerName, socketId) {
        //check for duplicate player names
        let player = this.players.find(e => e.name === playerName);
        if (!player) {
            player = new player_1.Player(playerName, socketId, this.players.length);
            this.players.push(player);
        }
        else {
            player.socketId = socketId;
        }
        return player;
    }
    addMessage(socketId, message) {
        const targetPlayer = this.getPlayer(socketId);
        if (targetPlayer) {
            let newMessage = {
                text: message,
                player: targetPlayer
            };
            this.messages.push(newMessage);
            return newMessage;
        }
        else {
            return null;
        }
    }
    getPlayer(socketId) {
        return this.players.find(p => p.socketId === socketId);
    }
}
exports.Room = Room;
//# sourceMappingURL=room.js.map