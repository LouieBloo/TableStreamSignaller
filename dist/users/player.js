"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const game_1 = require("../interfaces/game");
const user_1 = require("./user");
class Player extends user_1.User {
    constructor(name, socketId, turnOrder, startingLifeTotal) {
        super(name, socketId, game_1.UserType.Player);
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