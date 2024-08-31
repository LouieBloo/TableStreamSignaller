"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const { v4: uuidv4 } = require('uuid');
class Player {
    constructor(name, socketId, turnOrder, startingLifeTotal) {
        this.isMonarch = false;
        this.commanderDamages = {};
        this.takeCommanderDamage = (damagingPlayer, amount) => {
            //add or create the commander damage for this player
            if (this.commanderDamages[damagingPlayer.id]) {
                this.commanderDamages[damagingPlayer.id].damage += amount;
            }
            else {
                this.commanderDamages[damagingPlayer.id] = {
                    playerId: damagingPlayer.id,
                    damage: amount
                };
            }
            //prevent negative commander damage
            if (this.commanderDamages[damagingPlayer.id].damage < 0) {
                this.commanderDamages[damagingPlayer.id].damage = 0;
            }
            else {
                //remove lifetotal on commander damage
                this.lifeTotal -= amount;
            }
            //kill player if threshold met
            if (this.commanderDamages[damagingPlayer.id].damage >= 21) {
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
        this.energyTotal = 0;
        this.totalTurns = 0;
        this.totalTurnTime = 0;
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map