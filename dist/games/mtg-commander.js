"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTGCommander = void 0;
const game_1 = require("../interfaces/game");
const game_2 = require("./game");
class MTGCommander extends game_2.Game {
    constructor() {
        super(...arguments);
        this.startingLifeTotal = 40;
        this.modifyPlayerCommanderDamage = (gameEvent) => {
            return gameEvent.callingPlayer.takeCommanderDamage(gameEvent.payload.damagingPlayer, gameEvent.payload.amount);
        };
        this.setCommander = (gameEvent) => {
            gameEvent.callingPlayer.commander = gameEvent.payload;
            return gameEvent.callingPlayer;
        };
    }
    event(gameEvent, room) {
        switch (gameEvent.event) {
            case game_1.GameEvent.StartGame:
                return this.startGame(room);
            case game_1.GameEvent.ModifyPlayerCommanderDamage:
                return this.modifyPlayerCommanderDamage(gameEvent);
            case game_1.GameEvent.SetCommander:
                return this.setCommander(gameEvent);
        }
        return super.event(gameEvent, room);
    }
    //call the super startGame but also add our commander damage initialization
    startGame(room) {
        let players = super.startGame(room);
        //for each player
        players.forEach((pl) => {
            pl.commanderDamages = {};
            //for all other players (aka opponents)
            for (let x = 0; x < players.length; x++) {
                if (pl.id != players[x].id) {
                    pl.commanderDamages[players[x].id] = {
                        damage: 0,
                        playerId: players[x].id
                    };
                }
            }
        });
        return players;
    }
}
exports.MTGCommander = MTGCommander;
//# sourceMappingURL=mtg-commander.js.map