import { IUser } from "./IPlayer";

export interface IMessage {
    text: string;
    date: Date;
    player:IUser;
}
