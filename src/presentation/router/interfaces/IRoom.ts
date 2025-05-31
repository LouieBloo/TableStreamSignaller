import { GameType } from "../../../domain/interfaces/IGame";

export interface IRoom {
    id?:string;
    name:string;
    gameType?:GameType;
    passwordProtected?:boolean;
    maxPlayers?:number;
    currentPlayers?:number;
    reactionsEnabled?:boolean;
}