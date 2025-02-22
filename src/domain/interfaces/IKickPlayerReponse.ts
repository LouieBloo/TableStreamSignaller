import { Player } from "../users/player";
import { IToken } from "./ICards";
import { IUser } from "./IPlayer";


export interface IKickPlayerResponse {
    kickedPlayer?:IUser;
    players?: Player[];
    removedTokens?: IToken[];
}