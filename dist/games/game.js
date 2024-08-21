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
            case game_1.GameEvent.StartGame:
                return this.startGame(room);
            case game_1.GameEvent.EndCurrentTurn:
                return this.endCurrentTurn(room);
        }
    }
    startGame(room) {
        for (let x = 0; x < room.players.length; x++) {
            room.players[x].isTakingTurn = false;
            room.players[x].totalTurns = 0;
            room.players[x].totalTurnTime = 0;
            room.players[x].currentTurnStartTime = null;
        }
        let firstPlayer = room.players.find(p => p.turnOrder == 0);
        this.startPlayerTurn(firstPlayer, room);
        return room.players;
    }
    endCurrentTurn(room) {
        let currentPlayer = room.players.find(p => p.isTakingTurn == true);
        let nextPlayer = room.players.find(p => p.turnOrder == currentPlayer.turnOrder + 1);
        if (!nextPlayer) {
            nextPlayer = room.players.find(p => p.turnOrder == 0);
        }
        this.startPlayerTurn(nextPlayer, room);
        return room.players;
    }
    startPlayerTurn(nextPlayer, room) {
        let currentPlayer = room.players.find(p => p.isTakingTurn == true);
        currentPlayer.totalTurnTime += new Date().getTime() - currentPlayer.currentTurnStartTime.getTime();
        currentPlayer.currentTurnStartTime = null;
        currentPlayer.isTakingTurn = false;
        nextPlayer.totalTurns += 1;
        nextPlayer.currentTurnStartTime = new Date();
        nextPlayer.isTakingTurn = true;
    }
    findPlayerWithLowestTurnOrder(players) {
        if (players.length === 0)
            return undefined;
        return players.reduce((lowest, player) => player.turnOrder < lowest.turnOrder ? player : lowest);
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