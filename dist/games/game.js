"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const game_1 = require("../interfaces/game");
class Game {
    constructor() {
        this.startingLifeTotal = 20;
        this.active = false;
        this.sharedCards = [];
        this.findNextPlayer = (currentPlayer, room, tries = 1) => {
            let tr = currentPlayer.turnOrder + tries;
            if (tr >= room.players.length) {
                //tr = (tr - currentPlayer.turnOrder) - tries;
                tr = tr - room.players.length;
            }
            let nextPlayer = room.players.find(p => (p.turnOrder == tr && p.lifeTotal > 0));
            if (!nextPlayer) {
                if (tries >= room.players.length) {
                    return null;
                }
                else {
                    return this.findNextPlayer(currentPlayer, room, tries + 1);
                }
            }
            else {
                return nextPlayer;
            }
        };
        this.shareCard = (gameEvent) => {
            let blockCard = false;
            for (let x = 0; x < 3 && x < this.sharedCards.length; x++) {
                if (this.sharedCards[x].id == gameEvent.payload.id) {
                    blockCard = true;
                    break;
                }
            }
            if (blockCard) {
                return null;
            }
            this.sharedCards.unshift(gameEvent.payload);
            return gameEvent.payload;
        };
        this.toggleMonarch = (gameEvent, room) => {
            if (!this.active) {
                throw new game_1.GameError(game_1.GameErrorType.GameNotStarted, "The game has not started yet. Please start the game.");
            }
            if (gameEvent.callingPlayer.isMonarch) {
                gameEvent.callingPlayer.isMonarch = false;
            }
            else {
                room.players.forEach(player => {
                    if (player.id == gameEvent.callingPlayer.id) {
                        player.isMonarch = true;
                    }
                    else {
                        player.isMonarch = false;
                    }
                });
            }
            return room.players;
        };
    }
    event(gameEvent, room) {
        switch (gameEvent.event) {
            case game_1.GameEvent.RandomizePlayerOrder:
                return this.randomizePlayerOrder(room.players);
            case game_1.GameEvent.ModifyPlayerProperty:
                return this.modifyPlayerProperty(gameEvent);
            case game_1.GameEvent.StartGame:
                return this.startGame(room);
            case game_1.GameEvent.ResetGame:
                return this.startGame(room);
            case game_1.GameEvent.EndCurrentTurn:
                return this.endCurrentTurn(room);
            case game_1.GameEvent.ShareCard:
                return this.shareCard(gameEvent);
            case game_1.GameEvent.ToggleMonarch:
                return this.toggleMonarch(gameEvent, room);
        }
    }
    addPlayer(newPlayer, room) {
    }
    startGame(room) {
        //if(this.active){return null;}
        for (let x = 0; x < room.players.length; x++) {
            room.players[x].isTakingTurn = false;
            room.players[x].totalTurns = 0;
            room.players[x].totalTurnTime = 0;
            room.players[x].currentTurnStartTime = null;
            room.players[x].isMonarch = false;
            room.players[x].poisonTotal = 0;
            room.players[x].energyTotal = 0;
            room.players[x].commanderDamages = {};
            room.players[x].lifeTotal = this.startingLifeTotal;
        }
        let firstPlayer = room.players.find(p => p.turnOrder == 0);
        this.startPlayerTurn(firstPlayer, room);
        this.active = true;
        return room.players;
    }
    endCurrentTurn(room) {
        if (!this.active) {
            return null;
        }
        let currentPlayer = room.players.find(p => p.isTakingTurn == true);
        let nextPlayer = this.findNextPlayer(currentPlayer, room);
        if (nextPlayer != null) {
            this.startPlayerTurn(nextPlayer, room);
        }
        return room.players;
    }
    startPlayerTurn(nextPlayer, room) {
        let currentPlayer = room.players.find(p => p.isTakingTurn == true);
        if (currentPlayer) {
            // if the players turn was less than 500 ms dont count it as a turn and dont count the totalturntime, this is to prevent messing up averages when people are spamming pass turn
            if (new Date().getTime() - currentPlayer.currentTurnStartTime.getTime() < 1500) {
                // currentPlayer.totalTurns--;
            }
            else {
                currentPlayer.totalTurnTime += new Date().getTime() - currentPlayer.currentTurnStartTime.getTime();
                currentPlayer.totalTurns++;
            }
            currentPlayer.currentTurnStartTime = null;
            currentPlayer.isTakingTurn = false;
        }
        nextPlayer.currentTurnStartTime = new Date();
        nextPlayer.isTakingTurn = true;
    }
    findPlayerWithLowestTurnOrder(players) {
        if (players.length === 0)
            return undefined;
        return players.reduce((lowest, player) => player.turnOrder < lowest.turnOrder ? player : lowest);
    }
    modifyPlayerProperty(gameEvent) {
        if (!this.active) {
            throw new game_1.GameError(game_1.GameErrorType.GameNotStarted, "The game has not started yet. Please start the game.");
        }
        let modifyEvent = gameEvent.payload;
        switch (modifyEvent.property) {
            case game_1.PlayerProperties.lifeTotal:
                gameEvent.callingPlayer.lifeTotal += modifyEvent.amountToModify;
                break;
            case game_1.PlayerProperties.poisonTotal:
                gameEvent.callingPlayer.poisonTotal += modifyEvent.amountToModify;
                if (gameEvent.callingPlayer.poisonTotal < 0) {
                    gameEvent.callingPlayer.poisonTotal = 0;
                }
                break;
            case game_1.PlayerProperties.energyTotal:
                gameEvent.callingPlayer.energyTotal += modifyEvent.amountToModify;
                if (gameEvent.callingPlayer.energyTotal < 0) {
                    gameEvent.callingPlayer.energyTotal = 0;
                }
                break;
        }
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