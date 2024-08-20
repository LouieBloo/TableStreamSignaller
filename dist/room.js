"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const game_1 = require("./interfaces/game");
const player_1 = require("./player");
const mtg_commander_1 = require("./games/mtg-commander");
class Room {
    constructor(roomName, gameType) {
        this.name = roomName;
        this.messages = [];
        this.players = [];
        this.game = this.createGame(gameType);
    }
    createGame(gameType) {
        switch (gameType) {
            case game_1.GameType.MTGCommander:
                return new mtg_commander_1.MTGCommander();
                break;
        }
    }
    addPlayer(playerName, socketId) {
        //check for duplicate player names
        let player = this.players.find(e => e.name === playerName);
        if (!player) {
            player = new player_1.Player(playerName, socketId, this.players.length, this.game.startingLifeTotal);
            if (this.players.length == 0) {
                player.admin = true;
            }
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
                player: targetPlayer,
                date: new Date()
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
    gameEvent(socketId, gameEvent) {
        gameEvent.callingPlayer = this.getPlayer(socketId);
        return this.game.event(gameEvent, this);
    }
}
exports.Room = Room;
//# sourceMappingURL=room.js.map