import { Player } from "../users/player";
import { IGameEvent, GameEvent, ICommanderDamage, GameType } from "../interfaces/IGame";
import { Game } from "./game";
import { slimCard } from "../interfaces/ICards";
import { MTGGame } from "./mtg-game";


export class MTGStandard extends MTGGame {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGStandard;
    constructor(){
        super();
    }
}