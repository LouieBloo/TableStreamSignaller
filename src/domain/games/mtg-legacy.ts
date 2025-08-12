import { GameType } from "../interfaces/IGame";
import { MTGGame } from "./mtg-game";


export class MTGLegacy extends MTGGame {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGLegacy;
    constructor(){
        super();
        
    }
}