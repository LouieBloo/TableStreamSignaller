import { GameType } from "../interfaces/game";
import { Game } from "./game";


export class MTGLegacy extends Game {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGLegacy;
    constructor(){
        super();
        
    }
}