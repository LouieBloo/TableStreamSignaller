import { Player } from "../player";

export interface IGameEvent {
    callingPlayer:Player;
    event: GameEvent;
    payload?:any;
    response?: any;
}

export interface IModifyPlayerProperty{
    property:PlayerProperties;
    amountToModify:number;
}

export enum PlayerProperties{
    lifeTotal,
    poisonTotal
}

export enum GameEvent{
    RandomizePlayerOrder,
    ModifyPlayerProperty,
    StartGame,
    EndCurrentTurn,
    ShareCard,
    ToggleMonarch,
    ModifyPlayerCommanderDamage
}

export enum GameType{
    MTGCommander
}

export interface CommanderDamage{
    playerId:string;
    damage:number;
}