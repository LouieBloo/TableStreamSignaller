"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const { v4: uuidv4 } = require('uuid');
class Player {
    constructor(name, socketId, turnOrder) {
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.turnOrder = turnOrder;
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map