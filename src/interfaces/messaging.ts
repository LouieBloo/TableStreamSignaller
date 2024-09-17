import { IUser } from "./player";

export interface IMessage {
    text: string;
    date: Date;
    player:IUser;
}
