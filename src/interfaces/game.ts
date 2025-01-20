import { Player } from "../users/player";
import { PlayingCard } from "./cards";
import { IMessage } from "./messaging";

export interface IGameEvent {
    callingPlayer:Player;
    event: GameEvent;
    payload?:any;
    response?: any;
    messages?:IMessage[];
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
    citiesBlessing,
    prizeCards
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
    SetCommander,
    FlipCoins,
    PlayEffect,
    SetPlayerTurnOrders,
    CreateToken,
    ModifyToken,
    DeleteToken,
    RollDice
}

export enum GameType{
    Game,
    MTGCommander,
    MTGStandard,
    MTGModern,
    MTGLegacy,
    MTGVintage,
    PokemonStandard,
    MTGPauperCommander
}

export interface CommanderDamage{
    playerId:string;
    damage:number;
    card:PlayingCard;
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
    GenericWarning,
    RoomFull
}

export enum UserType{
    Player,
    Spectator
}

export interface ICoinFlipResults{
    results:string[]
}