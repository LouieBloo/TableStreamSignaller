import { Player } from "../player";

export interface IGameEvent {
    callingPlayer:Player;
    event: GameEvent;
    payload?:any;
    response?: any;
}

export interface IModifyPlayerLifeTotal{
    amountToModify:number;
}

export enum GameEvent{
    RandomizePlayerOrder,
    ModifyLifeTotal
}

export enum GameType{
    MTGCommander
}