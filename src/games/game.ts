import { Room } from "../room";
import { GameEvent, IGameEvent, IModifyPlayerLifeTotal } from "../interfaces/game";
import { Player } from "../player";

export class Game {

    startingLifeTotal = 20;

    public event(gameEvent: IGameEvent, room: Room): any {
        switch (gameEvent.event) {
            case GameEvent.RandomizePlayerOrder:
                return this.randomizePlayerOrder(room.players)
            case GameEvent.ModifyLifeTotal:
                return this.modifyPlayerLifeTotal(gameEvent)
        }
    }

    modifyPlayerLifeTotal(gameEvent: IGameEvent): Player {
        let modifyEvent:IModifyPlayerLifeTotal = gameEvent.payload;
        gameEvent.callingPlayer.lifeTotal += modifyEvent.amountToModify;

        return gameEvent.callingPlayer;
    }

    randomizePlayerOrder(players: Player[]) {
        if (players.length > 1) {
            const turnOrder = this.generateRandomNumbers(players.length);
            for (let x = 0; x < players.length; x++) {
                players[x].turnOrder = turnOrder[x];
            }
        }

        return players;
    }

    generateRandomNumbers(x: number) {
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