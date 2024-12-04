import { Player } from "../users/player";
import { IGameEvent, GameEvent, GameType } from "../interfaces/game";
import { Room } from "../rooms/room";
import { Game } from "./game";
import {ResetCommanderDamagesToZero, SetPlayerDefaults, SetCommander, ModifyPlayerCommanderDamage} from './services/mtg-commander-service';

export class MTGPauperCommander extends Game {
    startingLifeTotal = 30;
    maxCommanderDamageUntilDead: number = 16;

    gameType: GameType = GameType.MTGPauperCommander;

    constructor(){
        super();
    }

    public event(gameEvent: IGameEvent, room: Room): any {
        switch (gameEvent.event) {
            case GameEvent.StartGame:
                return this.startGame(room);
            case GameEvent.ResetGame:
                return this.startGame(room);
            case GameEvent.ModifyPlayerCommanderDamage:
                return this.modifyPlayerCommanderDamage(gameEvent);
            case GameEvent.SetCommander:
                return this.setCommander(gameEvent, room);
        }

        return super.event(gameEvent, room);
    }

    startGame(room: Room): Room {
        super.startGame(room);

        return ResetCommanderDamagesToZero(room);
    }

    setPlayerDefaults(newPlayer: Player, room:Room){
        super.setPlayerDefaults(newPlayer,room);

        SetPlayerDefaults(newPlayer, room);
    }

    setCommander = (gameEvent: IGameEvent, room:Room)=>{
        return SetCommander(gameEvent, room);
    }

    modifyPlayerCommanderDamage = (gameEvent: IGameEvent) => {
        return ModifyPlayerCommanderDamage(gameEvent, this.maxCommanderDamageUntilDead);
    }

}