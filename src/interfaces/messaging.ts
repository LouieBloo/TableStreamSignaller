import { Player } from "../users/player";

export interface IMessage {
    text: string;
    date: Date;
    player:Player;
}
