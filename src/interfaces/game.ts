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
    severity: GameErrorSeverity;

    constructor(type: GameErrorType, message: string, severity:GameErrorSeverity) {
        super(message); // Pass the message to the base Error class
        this.type = type;
        this.severity = severity;
    }
}

export enum GameErrorSeverity{
    Warning,
    Error,
}

export enum GameErrorType{
    GameNotStarted,
    InvalidAction,
    NoRoomName,
    InvalidPassword,
    GenericWarning
}

export enum UserType{
    Player,
    Spectator
}