import { GameType } from "../interfaces/IGame";
import { MTGGame } from "./mtg-game";


export class MTGModern extends MTGGame {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGModern;
    constructor(){
        super();
        
    }
}