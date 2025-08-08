import { Room } from "../rooms/room";
import { GameError, GameErrorSeverity, GameErrorType, GameEvent, GameProperties, GameType, IGameEvent, IModifyGameProperty, IModifyPlayerProperty, PlayerProperties } from "../interfaces/IGame";
import { Player } from "../users/player";
import { IPlayingCard, slimCard, IToken } from "../interfaces/ICards";
import { Type } from "class-transformer";
import { IKickPlayerResponse } from "../interfaces/IKickPlayerReponse";
const { v4: uuidv4 } = require('uuid');

export class Game {

    startingLifeTotal = 20;
    active:boolean = false;

    sharedCards:IPlayingCard[] = [];

    gameType: GameType;

    tokens:IToken[] = [];
    
    @Type(() => Date)
    startedAt:Date;

    dayNightCycle:string;

    public event(gameEvent: IGameEvent, room: Room): any {
        switch (gameEvent.event) {
            case GameEvent.RandomizePlayerOrder:
                return this.randomizePlayerOrder(room.players);
            case GameEvent.ModifyPlayerProperty:
                return this.modifyPlayerProperty(gameEvent, room);
            case GameEvent.ModifyGameProperty:
                return this.modifyGameProperty(gameEvent);
            case GameEvent.StartGame:
                return this.startGame(room);
            case GameEvent.ResetGame:
                return this.startGame(room);
            case GameEvent.EndCurrentTurn:
                return this.endCurrentTurn(room);
            case GameEvent.ShareCard:
                return this.shareCard(gameEvent);
            case GameEvent.FlipCoins:
                return this.flipCoins(gameEvent);
            case GameEvent.RollDice:
                return this.rollDice(gameEvent);
            case GameEvent.PlayEffect:
                return this.playEffect(gameEvent, room);
            case GameEvent.SetPlayerTurnOrders:
                return this.setPlayerTurnOrders(gameEvent, room);
            case GameEvent.CreateToken:
                return this.createToken(gameEvent);
            case GameEvent.DeleteToken:
                return this.deleteToken(gameEvent);
            case GameEvent.ModifyToken:
                return this.modifyToken(gameEvent);
            case GameEvent.KickPlayer:
                return this.kickPlayer(gameEvent, room);
        }
    }

    setPlayerDefaults(player: Player, room:Room){
    }

    startGame(room: Room):Room{
        //if(this.active){return null;}

        for(let x = 0; x < room.players.length; x++){
            room.players[x].isTakingTurn = false;
            room.players[x].totalTurns = 0;
            room.players[x].totalTurnTime = 0;
            room.players[x].currentTurnStartTime = null;
            room.players[x].isMonarch = false;
            room.players[x].hasCitiesBlessing = false;
            room.players[x].hasInitiative = false;
            room.players[x].poisonTotal = 0;
            room.players[x].energyTotal = 0;
            room.players[x].radiationTotal = 0;
            room.players[x].lifeTotal = this.startingLifeTotal;
            room.players[x].isDead = false;
        }

        let firstPlayer:Player = room.players.find(p=> p.turnOrder == 0);
        this.startPlayerTurn(firstPlayer, room);

        this.active = true;
        this.startedAt = new Date();

        return room;
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

        //rotate all of the nextPlayers tokens for conveniance
        // this.tokens.forEach((token:Token)=>{
        //     if(token.ownerId == nextPlayer.id){
        //         token.tapped = false;
        //     }
        // })
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

    modifyGameProperty(gameEvent:IGameEvent): Game{
        if(!this.active){
            throw new GameError(GameErrorType.GameNotStarted, "The game has not started yet. Please start the game.",GameErrorSeverity.Error);
        }

        let modifyEvent:IModifyGameProperty = gameEvent.payload;

        switch(modifyEvent.property){
            case GameProperties.DayNightCycle:
                this.dayNightCycle = modifyEvent.value;
                break;
        }
        
        return this;
    }

    // dont allow players to modify anything when the game hasn't started unless its a private property
    modifyPlayerPropertySecurityCheck = (gameEvent: IGameEvent)=>{
        if(!this.active && !gameEvent.isPrivate){
            throw new GameError(GameErrorType.GameNotStarted, "The game has not started yet. Please start the game.",GameErrorSeverity.Error);
        }
    }

    modifyPlayerProperty(gameEvent: IGameEvent, room: Room): Player[] {
        this.modifyPlayerPropertySecurityCheck(gameEvent);

        const modifyEvent:IModifyPlayerProperty = gameEvent.payload; 
        const callingPlayer = gameEvent.callingPlayer;
        const updatedPlayers: Player[] = [callingPlayer];

        switch(modifyEvent.property){
            case PlayerProperties.lifeTotal:
                callingPlayer.lifeTotal += modifyEvent.amountToModify;
                callingPlayer.isDead = callingPlayer.lifeTotal <= 0 ? true : false;
                break;
            case PlayerProperties.sharingImages:
               callingPlayer.isSharingImages = modifyEvent.value;
                break;
            case PlayerProperties.isAdmin:
                const newAdmin = room.setNewAdmin(modifyEvent.value, callingPlayer)
                updatedPlayers.push(newAdmin);
                break;
        }
        
        return updatedPlayers;
    }

    public kickPlayer(gameEvent: IGameEvent, room:Room):IKickPlayerResponse{

        //room will handle removing player
        let kickedPlayer:Player = room.kickPlayer(gameEvent);

        //remove all tokens from this user
        let removedTokens:IToken[] = this.removeTokenByPlayerId(kickedPlayer.id);

        //modify turn orders (remove 1 from every players turn order for each player above the removed players order)
        room.players.forEach((player:Player)=>{
            if(player.turnOrder > kickedPlayer.turnOrder){
                player.turnOrder--;
            }
        })

        //if we just kicked the player whos turn it was just choose the first player (players will figure out whos turn it should be)
        let currentPlayer = room.players.find(p=>p.isTakingTurn == true);
        if(!currentPlayer){
            this.startPlayerTurn(room.players[0],room);
        }
    
        this.sendMessage(`${gameEvent.callingPlayer.name} has kicked ${kickedPlayer.name}. Adios!`, gameEvent);

        return {kickedPlayer, removedTokens, players: room.players }
    }

    setPlayerTurnOrders(gameEvent: IGameEvent, room:Room){
        if(!gameEvent.callingPlayer.admin){
            throw new GameError(GameErrorType.GenericWarning, "Only admins can change player order!",GameErrorSeverity.Error);
        }

        room.players.forEach((player:Player)=>{
            let incomingPlayer:Player = gameEvent.payload.find((p:Player) => p.id === player.id);
            player.turnOrder = incomingPlayer.turnOrder;
        })
        
        return room.players;
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


    flipCoins = (gameEvent: IGameEvent): any=>{
        let coinFlips: string[] = [];
        for(let x = 0; x < gameEvent.payload.coinsToFlip; x++){
            let flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
            coinFlips.push(flipResult)
        }

        const message = `flipped ${coinFlips.length} coin${coinFlips.length == 1 ? '' : 's'}: ${coinFlips.join(', ')}`
        this.sendMessage(message, gameEvent);
        
        return {
            results: coinFlips
        }
    }

    rollDice = (gameEvent: IGameEvent): any=>{
        let diceRolls: string[] = [];
        for(let x = 0; x < gameEvent.payload.dicesToRoll; x++){
            let sidedDice:number = gameEvent.payload.sidedDice;
            diceRolls.push(Math.ceil(Math.random() * sidedDice) + "");
        }

        const message = `rolled a D${gameEvent.payload.sidedDice}: ${diceRolls.join(', ')}`
        this.sendMessage(message, gameEvent)


        return {
            results: diceRolls
        }
    }

    playEffect = (gameEvent: IGameEvent, room:Room): any => {
        if(!room.reactionsEnabled){
            throw new GameError(
                GameErrorType.GenericWarning,
                `Reactions are not enabled for this game`,
                GameErrorSeverity.Warning
            );
        }

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

    createToken = (gameEvent: IGameEvent): any => {
        let newToken:IToken = {
            id: uuidv4(),
            ownerId: gameEvent.callingPlayer.id,
            name: gameEvent.callingPlayer.name + "'s token",
            xPosition: 0.5,
            yPosition: 0.5
        }

        if(gameEvent.payload){
            let copyFromToken:IToken = gameEvent.payload;
            newToken.name = copyFromToken.name;
            newToken.card = copyFromToken.card;
        }

        this.tokens.push(newToken)

        return newToken;
    }

    modifyToken = (gameEvent: IGameEvent): any => {
        let payloadTokenToModify:IToken = gameEvent.payload;
        let tokenToModify = this.tokens.find(token=> token.id == payloadTokenToModify.id)

        if(tokenToModify){
            // only the owner can change the name and card
            if(tokenToModify.ownerId == gameEvent.callingPlayer.id){
                tokenToModify.name = payloadTokenToModify.name;
                tokenToModify.card = payloadTokenToModify.card ? slimCard(payloadTokenToModify.card) : null;
            }
            
            //all players can change the position and tap it 
            tokenToModify.xPosition = payloadTokenToModify.xPosition;
            tokenToModify.yPosition = payloadTokenToModify.yPosition;
            tokenToModify.tapped = payloadTokenToModify.tapped;
        }

        return tokenToModify;
    }

    deleteToken = (gameEvent: IGameEvent): any => {
        let payloadTokenToDelete:IToken = gameEvent.payload;
        let tokenToDelete = this.tokens.find(token=> token.id == payloadTokenToDelete.id && token.ownerId == gameEvent.callingPlayer.id)

        if(tokenToDelete){
            this.tokens = this.tokens.filter(token => token.id != tokenToDelete.id);
        }
        return tokenToDelete;
    } 


    private sendMessage(message: string, gameEvent: IGameEvent){
        gameEvent.messages.push({
            text: message,
            date: new Date(),
            player: gameEvent.callingPlayer
        });
    }

    private removeTokenByPlayerId(playerId: string): IToken[]{
        // Find the tokens that will be removed
        const removedTokens = this.tokens.filter(token => token.ownerId === playerId);

        // Keep only the tokens that do not belong to the player
        this.tokens = this.tokens.filter(token => token.ownerId !== playerId);

        // Return the removed tokens
        return removedTokens;
    }

    private promoteNewAdmin(room: Room, currentTurnOrder: number) {
        const newAdmin = room.players.find(player => player.turnOrder === currentTurnOrder + 1);
        if (newAdmin) {
            newAdmin.admin = true;
        }
    }

}