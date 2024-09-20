"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTGStandard = void 0;
const game_1 = require("../interfaces/game");
const game_2 = require("./game");
class MTGStandard extends game_2.Game {
    constructor() {
        super();
        this.startingLifeTotal = 20;
        this.gameType = game_1.GameType.MTGStandard;
    }
}
exports.MTGStandard = MTGStandard;
//# sourceMappingURL=mtg-standard.js.map