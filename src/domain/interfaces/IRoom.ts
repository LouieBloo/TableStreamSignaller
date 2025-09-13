import { Player } from "../users/player";
import { IGameEvent } from "./IGame";

export interface IRoomEvent {
    callingPlayer?:Player;
    event: RoomEvent;
    property?:string;
    value?:any;
}

export interface IRoomHistoryEvent {
    createdAt?: Date;
    player: {
        id: string;
        name: string;
    }
    property?:string;
    type?: string;
    value?: any;
    currentValue?:any;
}

export enum RoomEvent{
    PlayerAdded,
    PlayerRemoved,
    TurnOrderChanged
}