"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTGCommander = void 0;
const game_1 = require("./game");
class MTGCommander extends game_1.Game {
    constructor() {
        super(...arguments);
        this.startingLifeTotal = 40;
        // public event(gameEvent: IGameEvent, room: Room): any {
        //     switch (gameEvent.event) {
        //         case GameEvent.ModifyLifeTotal:
        //             return this.randomizePlayerOrder(room.players)
        //         default:
        //             return super.event(gameEvent, room);
        //     }
        // }
        // modifyPlayerLifeTotal(gameEvent: IGameEvent): void {
        // }
    }
}
exports.MTGCommander = MTGCommander;
//# sourceMappingURL=mtg-commander.js.map