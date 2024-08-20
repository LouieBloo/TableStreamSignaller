"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const game_1 = require("../interfaces/game");
class Game {
    constructor() {
        this.startingLifeTotal = 20;
    }
    event(gameEvent, room) {
        switch (gameEvent.event) {
            case game_1.GameEvent.RandomizePlayerOrder:
                return this.randomizePlayerOrder(room.players);
            case game_1.GameEvent.ModifyLifeTotal:
                return this.modifyPlayerLifeTotal(gameEvent);
        }
    }
    modifyPlayerLifeTotal(gameEvent) {
        let modifyEvent = gameEvent.payload;
        gameEvent.callingPlayer.lifeTotal += modifyEvent.amountToModify;
        return gameEvent.callingPlayer;
    }
    randomizePlayerOrder(players) {
        if (players.length > 1) {
            const turnOrder = this.generateRandomNumbers(players.length);
            for (let x = 0; x < players.length; x++) {
                players[x].turnOrder = turnOrder[x];
            }
        }
        return players;
    }
    generateRandomNumbers(x) {
        // Create an array containing numbers from 0 to x
        const numbers = [];
        for (let i = 0; i < x; i++) {
            numbers.push(i);
        }
        // Shuffle the array to randomize the order of the numbers
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // Swap elements
        }
        // Return the shuffled array
        return numbers;
    }
}
exports.Game = Game;
//# sourceMappingURL=game.js.map