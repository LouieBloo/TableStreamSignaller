import { Player } from "../users/player";
import { Token } from "./cards";
import { IUser } from "./player";


export interface KickPlayerResponse {
    kickedPlayer?:IUser;
    players?: Player[];
    removedTokens?: Token[];
}