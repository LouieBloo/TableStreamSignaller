import { IPlayer } from "./iPlayer";

export interface IMessage {
    text: string;
    date: Date;
    player:IPlayer;
}
