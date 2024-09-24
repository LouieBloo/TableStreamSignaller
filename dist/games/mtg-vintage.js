"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTGVintage = void 0;
const game_1 = require("../interfaces/game");
const game_2 = require("./game");
class MTGVintage extends game_2.Game {
    constructor() {
        super();
        this.startingLifeTotal = 20;
        this.gameType = game_1.GameType.MTGVintage;
    }
}
exports.MTGVintage = MTGVintage;
//# sourceMappingURL=mtg-vintage.js.map