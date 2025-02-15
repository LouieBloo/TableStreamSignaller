import { Player } from "../domain/users/player";
import { IGameEvent, GameEvent, CommanderDamage, GameType } from "./interfaces/game";
import { Game } from "./game";
import { slimCard } from "./interfaces/cards";


export class MTGStandard extends Game {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGStandard;
    constructor(){
        super();
    }
}