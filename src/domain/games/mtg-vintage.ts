import { GameType } from "../interfaces/IGame";
import { MTGGame } from "./mtg-game";


export class MTGVintage extends MTGGame {
    startingLifeTotal = 20;
    gameType:GameType = GameType.MTGVintage;
    constructor(){
        super();
        
    }
}