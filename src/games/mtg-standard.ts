import { Player } from "../users/player";
import { IGameEvent, GameEvent, CommanderDamage, GameType } from "../interfaces/game";
import { Room } from "../room";
import { Game } from "./game";
import { slimCard } from "../interfaces/cards";


export class MTGStandard extends Game {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGStandard;
    constructor(){
        super();
    }
}