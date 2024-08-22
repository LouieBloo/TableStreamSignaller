import { Room } from "../room";
import { GameEvent, IGameEvent, IModifyPlayerLifeTotal } from "../interfaces/game";
import { Player } from "../player";

export class Game {

    startingLifeTotal = 20;
    active:boolean = false;

    public event(gameEvent: IGameEvent, room: Room): any {
        switch (gameEvent.event) {
            case GameEvent.RandomizePlayerOrder:
                return this.randomizePlayerOrder(room.players)
            case GameEvent.ModifyLifeTotal:
                return this.modifyPlayerLifeTotal(gameEvent)
            case GameEvent.StartGame:
                return this.startGame(room);
            case GameEvent.EndCurrentTurn:
                return this.endCurrentTurn(room)
        }
    }

    startGame(room: Room){
        if(this.active){return null;}

        for(let x = 0; x < room.players.length; x++){
            room.players[x].isTakingTurn = false;
            room.players[x].totalTurns = 0;
            room.players[x].totalTurnTime = 0;
            room.players[x].currentTurnStartTime = null;
        }

        let firstPlayer:Player = room.players.find(p=> p.turnOrder == 0);
        this.startPlayerTurn(firstPlayer, room);

        this.active = true;

        return room.players;
    }

    endCurrentTurn(room:Room){
        if(!this.active){return null;}

        let currentPlayer = room.players.find(p=>p.isTakingTurn == true);
        let nextPlayer = room.players.find(p=>p.turnOrder == currentPlayer.turnOrder+1)
        if(!nextPlayer){
            nextPlayer = room.players.find(p=> p.turnOrder == 0);
        }

        this.startPlayerTurn(nextPlayer, room);

        return room.players;
    }

    startPlayerTurn(nextPlayer: Player,room:Room){
        let currentPlayer = room.players.find(p=>p.isTakingTurn == true);

        if(currentPlayer){
            //if the players turn was less than 500 ms dont count it as a turn and dont count the totalturntime, this is to prevent messing up averages when people are spamming pass turn
            // if(new Date().getTime() - currentPlayer.currentTurnStartTime.getTime() < 500){
            //     currentPlayer.totalTurns--;
            // }else{
            //     currentPlayer.totalTurnTime += new Date().getTime() - currentPlayer.currentTurnStartTime.getTime();
            // }

            currentPlayer.totalTurnTime += new Date().getTime() - currentPlayer.currentTurnStartTime.getTime();
            currentPlayer.totalTurns++;
            currentPlayer.currentTurnStartTime = null;
            currentPlayer.isTakingTurn = false;
        }

        nextPlayer.currentTurnStartTime = new Date();
        nextPlayer.isTakingTurn = true;
    }

    findPlayerWithLowestTurnOrder(players: Player[]): Player | undefined {
        if (players.length === 0) return undefined;
    
        return players.reduce((lowest, player) => 
            player.turnOrder < lowest.turnOrder ? player : lowest
        );
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