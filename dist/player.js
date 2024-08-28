"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const { v4: uuidv4 } = require('uuid');
class Player {
    constructor(name, socketId, turnOrder, startingLifeTotal) {
        this.isMonarch = false;
        this.commanderDamages = {};
        this.takeCommanderDamage = (damagingPlayer, amount) => {
            if (this.commanderDamages[damagingPlayer.id]) {
                this.commanderDamages[damagingPlayer.id].damage += amount;
            }
            else {
                this.commanderDamages[damagingPlayer.id] = {
                    playerId: damagingPlayer.id,
                    damage: amount
                };
            }
            this.lifeTotal -= amount;
            if (this.commanderDamages[damagingPlayer.id].damage >= 20) {
                this.lifeTotal = 0;
            }
            return this;
        };
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.turnOrder = turnOrder;
        this.lifeTotal = startingLifeTotal;
        this.poisonTotal = 0;
        this.totalTurns = 0;
        this.totalTurnTime = 0;
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map