import { Player } from "../users/player";
import { IGameEvent, GameEvent, CommanderDamage, GameType } from "../interfaces/game";
import { Room } from "../rooms/room";
import { Game } from "./game";
import { PlayingCard, slimCard } from "../interfaces/cards";


export class MTGCommander extends Game {
    startingLifeTotal = 40;

    gameType: GameType = GameType.MTGCommander;

    constructor(){
        super();
    }

    public event(gameEvent: IGameEvent, room: Room): any {
        switch (gameEvent.event) {
            case GameEvent.StartGame:
                return this.startGame(room);
            case GameEvent.ModifyPlayerCommanderDamage:
                return this.modifyPlayerCommanderDamage(gameEvent);
            case GameEvent.SetCommander:
                return this.setCommander(gameEvent, room);
        }

        return super.event(gameEvent, room);
    }

    startGame(room: Room): Player[] {
        super.startGame(room);

        //reset all commander damages to zero
        room.players.forEach((player:Player)=>{
            for (const [opponentId, value] of Object.entries(player.commanderDamages)) {
                for (const [cardId, value2] of Object.entries(player.commanderDamages[opponentId])) {
                    player.commanderDamages[opponentId][cardId].damage = 0;
                }
            }
        })

        return room.players;
    }

    setPlayerDefaults(newPlayer: Player, room:Room){
        super.setPlayerDefaults(newPlayer,room);

        newPlayer.commanders = []
        newPlayer.commanderDamages = {};

        //initilize this new players commander damages of any other players that are already in the game
        room.players.forEach((oldPlayer:Player)=>{
            if(oldPlayer.id != newPlayer.id){
                newPlayer.commanderDamages[oldPlayer.id] = {};
                oldPlayer.commanders.forEach((commander:PlayingCard)=>{
                    newPlayer.commanderDamages[oldPlayer.id][commander.id] = {
                        playerId: oldPlayer.id,
                        damage: 0,
                        card: commander
                    }
                })
            }
        })
    }

    setCommander = (gameEvent: IGameEvent, room:Room)=>{
        //helper variables
        let targetPlayer:Player = gameEvent.callingPlayer;
        let newCommander:PlayingCard = gameEvent.payload.card
        let oldCommander:PlayingCard = gameEvent.payload.index < gameEvent.callingPlayer.commanders.length ?  gameEvent.callingPlayer.commanders[gameEvent.payload.index] : null;
        //set new commander, its possible its null (to clear)
        if(newCommander){
            gameEvent.callingPlayer.commanders[gameEvent.payload.index] = slimCard(newCommander);
        }else{
            //note we only ever clear out the 2nd commander
            gameEvent.callingPlayer.commanders = [gameEvent.callingPlayer.commanders[0]]
        }

        //modify all the other players commander damages to reflect this new commander
        room.players.forEach((player:Player)=>{
            if(player.id != targetPlayer.id){
                //this player might not have any commander damages from the target player yet. Initilize it
                if(!player.commanderDamages[targetPlayer.id]){
                    player.commanderDamages[targetPlayer.id] = {};
                }
                //remove old commander if it exists
                if(oldCommander &&  player.commanderDamages[targetPlayer.id][oldCommander.id]){
                    delete(player.commanderDamages[targetPlayer.id][oldCommander.id])
                }

                //set new commander damage (could be null if clearing)
                if(newCommander){
                    player.commanderDamages[targetPlayer.id][newCommander.id] = {
                        playerId: targetPlayer.id,
                        damage: 0,
                        card: newCommander
                    }
                }
            }
        })

        return room.players;
    }

    modifyPlayerCommanderDamage = (gameEvent: IGameEvent) => {
        return gameEvent.callingPlayer.takeCommanderDamage(gameEvent.payload.damagingPlayer, gameEvent.payload.amount, gameEvent.payload.card);
    }

}