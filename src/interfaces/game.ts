import { Player } from "../users/player";

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
    poisonTotal,
    energyTotal,
    monarch,
    citiesBlessing
}

export enum GameEvent{
    RandomizePlayerOrder,
    ModifyPlayerProperty,
    StartGame,
    ResetGame,
    EndCurrentTurn,
    ShareCard,
    ToggleMonarch,
    ModifyPlayerCommanderDamage,
    SetCommander
}

export enum GameType{
    Game,
    MTGCommander,
    MTGStandard,
    MTGModern,
    MTGLegacy,
    MTGVintage
}

export interface CommanderDamage{
    playerId:string;
    damage:number;
}

export class GameError extends Error {
    type: GameErrorType;

    constructor(type: GameErrorType, message: string) {
        super(message); // Pass the message to the base Error class
        this.type = type;
    }
}

export enum GameErrorType{
    GameNotStarted,
    InvalidAction,
    NoRoomName,
    InvalidPassword
}

export enum UserType{
    Player,
    Spectator
}