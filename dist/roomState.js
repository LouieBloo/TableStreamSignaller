"use strict";
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
exports.RoomState = void 0;
const game_1 = require("./interfaces/game");
const room_1 = require("./room");
const class_transformer_1 = require("class-transformer");
const redis_1 = require("./redis");
const mtg_commander_1 = require("./games/mtg-commander");
class RoomState {
    // rooms: { [key: string]: Room };
    constructor() {
    }
    getOrCreateRoom(roomName, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            let redisResult = yield (0, redis_1.lockRoomAndGetState)(roomId);
            let room = null;
            if (!redisResult.room) {
                if (!roomName) {
                    throw new game_1.GameError(game_1.GameErrorType.GameNotStarted, "Room name required");
                }
                room = new room_1.Room(roomName, game_1.GameType.MTGCommander);
            }
            else {
                room = this.parseRoom(redisResult.room);
            }
            room.redisLock = redisResult.lock;
            //console.log("Got Room: ", room)
            return room;
        });
    }
    getRoom(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            let redisResult = yield (0, redis_1.lockRoomAndGetState)(roomId);
            let rawRoom = redisResult.room;
            if (!rawRoom) {
                return null;
            }
            let room = this.parseRoom(rawRoom);
            room.redisLock = redisResult.lock;
            //console.log("Got Room: ", room)
            return room;
        });
    }
    parseRoom(roomString) {
        let rawJSON = JSON.parse(roomString);
        let game = null;
        switch (rawJSON.game.gameType) {
            case game_1.GameType.Game:
                console.error("GENERIC GAME OH NO!");
                break;
            case game_1.GameType.MTGCommander:
                game = new mtg_commander_1.MTGCommander();
                break;
        }
        Object.assign(game, rawJSON.game);
        const room = (0, class_transformer_1.plainToInstance)(room_1.Room, JSON.parse(roomString));
        room.game = game;
        return room;
    }
    deleteRoom(room) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (this.rooms[roomName]) {
            //   delete (this.rooms[roomName])
            // }
            yield (0, redis_1.deleteRoomAndUnlock)(room);
        });
    }
}
exports.RoomState = RoomState;
//# sourceMappingURL=roomState.js.map