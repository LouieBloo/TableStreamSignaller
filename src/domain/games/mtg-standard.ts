import { GameType } from "../interfaces/IGame";
import { MTGGame } from "./mtg-game";


export class MTGStandard extends MTGGame {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGStandard;
    constructor(){
        super();
    }
}