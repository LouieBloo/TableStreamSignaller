"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const game_1 = require("./games/game");
const game_2 = require("./interfaces/game");
const player_1 = require("./users/player");
const mtg_commander_1 = require("./games/mtg-commander");
const spectator_1 = require("./users/spectator");
const redis_1 = require("./redis");
const class_transformer_1 = require("class-transformer");
const mtg_standard_1 = require("./games/mtg-standard");
const mtg_modern_1 = require("./games/mtg-modern");
const { v4: uuidv4 } = require('uuid');
class Room {
    constructor(roomName, gameType) {
        this.playerSockets = [];
        this.spectatorSockets = [];
        this.saveAndClose = () => __awaiter(this, void 0, void 0, function* () {
            (0, redis_1.saveRoomAndUnlock)(this);
        });
        this.close = () => __awaiter(this, void 0, void 0, function* () {
            (0, redis_1.unlockRoom)(this.redisLock);
        });
        this.id = uuidv4();
        this.name = roomName;
        this.messages = [];
        this.players = [];
        this.spectators = [];
        this.game = Room.createGame(gameType);
    }
    static createGame(gameType) {
        if (typeof gameType === 'string') {
            gameType = Number(gameType);
        }
        switch (gameType) {
            case game_2.GameType.MTGCommander:
                console.log("oh yeah");
                return new mtg_commander_1.MTGCommander();
                break;
            case game_2.GameType.MTGStandard:
                return new mtg_standard_1.MTGStandard();
                break;
            case game_2.GameType.MTGModern:
                return new mtg_modern_1.MTGModern();
                break;
        }
    }
    addPlayer(playerId, playerName, socketId) {
        let player = this.players.find(e => e.id === playerId);
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
                player: { name: targetPlayer.name, id: targetPlayer.id },
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
            throw new game_2.GameError(game_2.GameErrorType.InvalidAction, "You cant make that action");
        }
    }
}
exports.Room = Room;
__decorate([
    (0, class_transformer_1.Type)(() => player_1.Player),
    __metadata("design:type", Array)
], Room.prototype, "players", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => spectator_1.Spectator),
    __metadata("design:type", Array)
], Room.prototype, "spectators", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => game_1.Game),
    __metadata("design:type", game_1.Game)
], Room.prototype, "game", void 0);
//# sourceMappingURL=room.js.map