"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spectator = void 0;
const game_1 = require("../interfaces/game");
const user_1 = require("./user");
class Spectator extends user_1.User {
    constructor(name, socketId) {
        super(name, socketId, game_1.UserType.Spectator);
    }
}
exports.Spectator = Spectator;
//# sourceMappingURL=spectator.js.map