import { Player } from "../player";
import { IGameEvent, GameEvent, CommanderDamage } from "../interfaces/game";
import { Room } from "../room";
import { Game } from "./game";


export class MTGCommander extends Game {
    startingLifeTotal = 40;

    public event(gameEvent: IGameEvent, room: Room): any {
        switch (gameEvent.event) {
            case GameEvent.StartGame:
                return this.startGame(room);
            case GameEvent.ModifyPlayerCommanderDamage:
                return this.modifyPlayerCommanderDamage(gameEvent);
        }

        return super.event(gameEvent, room);
    }

    modifyPlayerCommanderDamage = (gameEvent: IGameEvent) => {
        return gameEvent.callingPlayer.takeCommanderDamage(gameEvent.payload.damagingPlayer, gameEvent.payload.amount);
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