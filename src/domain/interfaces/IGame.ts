import { Player } from "../users/player";
import { IPlayingCard } from "./ICards";
import { IMessage } from "./IMessaging";

export interface IGameEvent {
    callingPlayer:Player;
    event: GameEvent;
    payload?:any;
    response?: any;
    messages?:IMessage[];
    isPrivate?:boolean;
}

export interface IModifyGameProperty{
    property:GameProperties;
    value?:any;
}

export enum GameProperties{
    DayNightCycle
}
export interface IModifyPlayerProperty{
    property:PlayerProperties;
    amountToModify:number;
    value?:any;
}

export enum PlayerProperties{
    lifeTotal,
    poisonTotal,
    energyTotal,
    monarch,
    citiesBlessing,
    prizeCards,
    sharingImages,
    commanderCastAmount,
    initiative,
    radiationTotal
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
    RollDice,
    KickPlayer,
    ModifyGameProperty,
    ToggleInitiative
}

export enum GameType{
    Game,
    MTGCommander,
    MTGStandard,
    MTGModern,
    MTGLegacy,
    MTGVintage,
    PokemonStandard,
    MTGPauperCommander,
    YugiohStandard
}

export interface ICommanderDamage{
    playerId:string;
    damage:number;
    card:IPlayingCard;
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
    RoomFull,
    EnteringBannedRoom
}

export enum UserType{
    Player,
    Spectator
}

export interface ICoinFlipResults{
    results:string[]
}