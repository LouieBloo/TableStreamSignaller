"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTGLegacy = void 0;
const game_1 = require("../interfaces/game");
const game_2 = require("./game");
class MTGLegacy extends game_2.Game {
    constructor() {
        super();
        this.startingLifeTotal = 20;
        this.gameType = game_1.GameType.MTGLegacy;
    }
}
exports.MTGLegacy = MTGLegacy;
//# sourceMappingURL=mtg-legacy.js.map