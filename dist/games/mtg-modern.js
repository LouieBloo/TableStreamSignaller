"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTGModern = void 0;
const game_1 = require("../interfaces/game");
const game_2 = require("./game");
class MTGModern extends game_2.Game {
    constructor() {
        super();
        this.startingLifeTotal = 20;
        this.gameType = game_1.GameType.MTGModern;
    }
}
exports.MTGModern = MTGModern;
//# sourceMappingURL=mtg-modern.js.map