import { Player } from "../player";

export interface IMessage {
    text: string;
    date: Date;
    player:Player;
}
