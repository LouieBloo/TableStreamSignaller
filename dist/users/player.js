"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const game_1 = require("../interfaces/game");
const user_1 = require("./user");
const class_transformer_1 = require("class-transformer");
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
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], Player.prototype, "currentTurnStartTime", void 0);
//# sourceMappingURL=player.js.map