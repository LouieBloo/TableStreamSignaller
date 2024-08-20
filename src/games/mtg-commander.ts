import { IGameEvent, GameEvent } from "../interfaces/game";
import { Room } from "../room";
import { Game } from "./game";

export class MTGCommander extends Game{
    startingLifeTotal = 40;
    // public event(gameEvent: IGameEvent, room: Room): any {
    //     switch (gameEvent.event) {
    //         case GameEvent.ModifyLifeTotal:
    //             return this.randomizePlayerOrder(room.players)
    //         default:
    //             return super.event(gameEvent, room);
    //     }
    // }

    // modifyPlayerLifeTotal(gameEvent: IGameEvent): void {
        
    // }
}