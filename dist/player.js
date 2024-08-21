"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const { v4: uuidv4 } = require('uuid');
class Player {
    constructor(name, socketId, turnOrder, startingLifeTotal) {
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.turnOrder = turnOrder;
        this.lifeTotal = startingLifeTotal;
        this.totalTurns = 0;
        this.totalTurnTime = 0;
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map