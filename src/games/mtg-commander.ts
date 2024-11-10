import { Player } from "../users/player";
import { IGameEvent, GameEvent, GameType } from "../interfaces/game";
import { Room } from "../rooms/room";
import { Game } from "./game";


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
                gameEvent.callingPlayer.takeCommanderDamage(gameEvent.payload.damagingPlayer, gameEvent.payload.amount, gameEvent.payload.target);
                return gameEvent.callingPlayer;
            case GameEvent.SetCommander:
                gameEvent.callingPlayer.setCommander(gameEvent.payload)
                return gameEvent.callingPlayer;
        }

        return super.event(gameEvent, room);
    }

    //call the super startGame but also add our commander damage initialization
    startGame(room: Room): Player[] {
        let players: Player[] = super.startGame(room);

        //for each player
        players.forEach((pl: Player) => {
            pl.commanderDamages = {};

            //for all other players (aka opponents)
            for (let x = 0; x < players.length; x++) {
                if(pl.id != players[x].id){
                    pl.commanderDamages[players[x].id] = {
                        damage: 0,
                        playerId: players[x].id
                    }
                }
            }
            
        })

        return players;
    }

}