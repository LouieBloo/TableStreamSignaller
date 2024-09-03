"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const game_1 = require("./interfaces/game");
const player_1 = require("./users/player");
const mtg_commander_1 = require("./games/mtg-commander");
const spectator_1 = require("./users/spectator");
class Room {
    constructor(roomName, gameType) {
        this.playerSockets = [];
        this.spectatorSockets = [];
        this.name = roomName;
        this.messages = [];
        this.players = [];
        this.spectators = [];
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
    addSpectator(spectatorName, socketId) {
        //check for duplicate player names
        let spectator = this.spectators.find(e => e.name === spectatorName);
        if (!spectator) {
            spectator = new spectator_1.Spectator(spectatorName, socketId);
            this.spectators.push(spectator);
        }
        else {
            spectator.socketId = socketId;
        }
        return spectator;
    }
    userDisconnected(socketId) {
        this.playerSockets = this.playerSockets.filter((id) => id !== socketId);
        this.spectatorSockets = this.spectatorSockets.filter((id) => id !== socketId);
    }
    getAllSocketIds() {
        return this.playerSockets.concat(this.spectatorSockets);
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
        if (gameEvent.callingPlayer) {
            return this.game.event(gameEvent, this);
        }
        else {
            throw new game_1.GameError(game_1.GameErrorType.InvalidAction, "You cant make that action");
        }
    }
}
exports.Room = Room;
//# sourceMappingURL=room.js.map