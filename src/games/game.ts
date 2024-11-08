import { Room } from "../rooms/room";
import { GameError, GameErrorSeverity, GameErrorType, GameEvent, GameType, ICoinFlipResults, IGameEvent, IModifyPlayerProperty, PlayerProperties } from "../interfaces/game";
import { Player } from "../users/player";
import { PlayingCard, slimCard } from "../interfaces/cards";

export class Game {

    startingLifeTotal = 20;
    active:boolean = false;

    sharedCards:PlayingCard[] = [];

    gameType: GameType;

    public event(gameEvent: IGameEvent, room: Room): any {
        switch (gameEvent.event) {
            case GameEvent.RandomizePlayerOrder:
                return this.randomizePlayerOrder(room.players);
            case GameEvent.ModifyPlayerProperty:
                return this.modifyPlayerProperty(gameEvent);
            case GameEvent.StartGame:
                return this.startGame(room);
            case GameEvent.ResetGame:
                    return this.startGame(room);
            case GameEvent.EndCurrentTurn:
                return this.endCurrentTurn(room);
            case GameEvent.ShareCard:
                return this.shareCard(gameEvent);
            case GameEvent.ToggleMonarch:
                return this.toggleMonarch(gameEvent, room);
            case GameEvent.FlipCoins:
                return this.flipCoins(gameEvent);
            case GameEvent.PlayEffect:
                return this.playEffect(gameEvent);
        }
    }

    setPlayerDefaults(player: Player){
    }

    startGame(room: Room){
        //if(this.active){return null;}

        for(let x = 0; x < room.players.length; x++){
            room.players[x].isTakingTurn = false;
            room.players[x].totalTurns = 0;
            room.players[x].totalTurnTime = 0;
            room.players[x].currentTurnStartTime = null;
            room.players[x].isMonarch = false;
            room.players[x].hasCitiesBlessing = false;
            room.players[x].poisonTotal = 0;
            room.players[x].energyTotal = 0;
            room.players[x].commanderDamages = {};
            room.players[x].lifeTotal = this.startingLifeTotal;
            room.players[x].isDead = false;
        }

        let firstPlayer:Player = room.players.find(p=> p.turnOrder == 0);
        this.startPlayerTurn(firstPlayer, room);

        this.active = true;

        return room.players;
    }

    endCurrentTurn(room:Room){
        if(!this.active){return null;}

        let currentPlayer = room.players.find(p=>p.isTakingTurn == true);

        let nextPlayer = this.findNextPlayer(currentPlayer,room);

        if(nextPlayer != null){
            this.startPlayerTurn(nextPlayer, room);
        }

        return room.players;
    }

    startPlayerTurn(nextPlayer: Player,room:Room){
        let currentPlayer = room.players.find(p=>p.isTakingTurn == true);

        if(currentPlayer){
            // if the players turn was less than 500 ms dont count it as a turn and dont count the totalturntime, this is to prevent messing up averages when people are spamming pass turn
            if(new Date().getTime() - currentPlayer.currentTurnStartTime.getTime() < 1500){
                // currentPlayer.totalTurns--;
            }else{
                currentPlayer.totalTurnTime += new Date().getTime() - currentPlayer.currentTurnStartTime.getTime();
                currentPlayer.totalTurns++;
            }

            currentPlayer.currentTurnStartTime = null;
            currentPlayer.isTakingTurn = false;
        }

        nextPlayer.currentTurnStartTime = new Date();
        nextPlayer.isTakingTurn = true;
    }

    findNextPlayer = (currentPlayer: Player, room:Room, tries:number = 1):Player=>{
        let tr = currentPlayer.turnOrder + tries;
        if(tr >= room.players.length){
            //tr = (tr - currentPlayer.turnOrder) - tries;
            tr = tr-room.players.length;
        }

        let nextPlayer = room.players.find(p=> (p.turnOrder == tr && !p.isDead))
        if(!nextPlayer){
            if(tries >= room.players.length){
                return null;
            }else{
                return this.findNextPlayer(currentPlayer,room,tries+1);
            }
        }else{
            return nextPlayer;
        }
    }

    findPlayerWithLowestTurnOrder(players: Player[]): Player | undefined {
        if (players.length === 0) return undefined;
    
        return players.reduce((lowest, player) => 
            player.turnOrder < lowest.turnOrder ? player : lowest
        );
    }

    modifyPlayerProperty(gameEvent: IGameEvent): Player {
        if(!this.active){
            throw new GameError(GameErrorType.GameNotStarted, "The game has not started yet. Please start the game.",GameErrorSeverity.Error);
        }

        let modifyEvent:IModifyPlayerProperty = gameEvent.payload;

        switch(modifyEvent.property){
            case PlayerProperties.lifeTotal:
                gameEvent.callingPlayer.lifeTotal += modifyEvent.amountToModify;
                gameEvent.callingPlayer.isDead = gameEvent.callingPlayer.lifeTotal <= 0 ? true : false;
                break;
            case PlayerProperties.poisonTotal:
                gameEvent.callingPlayer.poisonTotal += modifyEvent.amountToModify;
                if(gameEvent.callingPlayer.poisonTotal < 0){gameEvent.callingPlayer.poisonTotal = 0;}
                break;
            case PlayerProperties.energyTotal:
                gameEvent.callingPlayer.energyTotal += modifyEvent.amountToModify;
                if(gameEvent.callingPlayer.energyTotal < 0){gameEvent.callingPlayer.energyTotal = 0;}
                break;
            case PlayerProperties.citiesBlessing:
                gameEvent.callingPlayer.hasCitiesBlessing = !gameEvent.callingPlayer.hasCitiesBlessing;
                break;
        }
        
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
    
    shareCard = (gameEvent: IGameEvent)=>{
        let blockCard = false;
        const numberOfCardsBackToCheck = 3;
        for(let x = 0; x < numberOfCardsBackToCheck && x < this.sharedCards.length; x++){
            if(this.sharedCards[x].id == gameEvent.payload.id){
                throw new GameError(GameErrorType.GenericWarning, "Card shared recently", GameErrorSeverity.Warning); 
            }
        }

        this.sharedCards.unshift(slimCard(gameEvent.payload));

        return gameEvent.payload;
    }

    // this is seperated from modify player properties since its touching all players
    toggleMonarch = (gameEvent: IGameEvent, room: Room)=>{

        if(!this.active){
            throw new GameError(GameErrorType.GameNotStarted, "The game has not started yet. Please start the game.", GameErrorSeverity.Error);
        }

        if(gameEvent.callingPlayer.isMonarch){
            gameEvent.callingPlayer.isMonarch = false;
        }else{
            room.players.forEach(player=>{
                if(player.id == gameEvent.callingPlayer.id){
                    player.isMonarch = true;
                }else{
                    player.isMonarch = false;
                }
            })
        }

        return room.players;
    }

    flipCoins = (gameEvent: IGameEvent): any=>{
        let coinFlips: string[] = [];
        for(let x = 0; x < gameEvent.payload.coinsToFlip; x++){
            let flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
            coinFlips.push(flipResult)
        }

        gameEvent.messages.push({
            text: `flipped ${coinFlips.length} coin${coinFlips.length == 1 ? '' : 's'}: ${coinFlips.join(', ')}`,
            date: new Date(),
            player: gameEvent.callingPlayer
        });

        return {
            results: coinFlips
        }
    }

    playEffect = (gameEvent: IGameEvent): any => {
        const now = new Date();
        
        // make sure the user isnt spamming reactions
        if (gameEvent.callingPlayer.lastEffectTime) {
            const timeDifference = now.getTime() - gameEvent.callingPlayer.lastEffectTime.getTime();

            const waitTimeInSeconds = 8; // required wait time in seconds
            const remainingTime = waitTimeInSeconds - Math.floor(timeDifference / 1000);

            if (timeDifference < waitTimeInSeconds * 1000) { 
                throw new GameError(
                    GameErrorType.GenericWarning,
                    `You must wait ${remainingTime} seconds before another reaction`,
                    GameErrorSeverity.Warning
                );
            }
        } 

        gameEvent.callingPlayer.lastEffectTime = now;
    
        return gameEvent.payload;
    }
}