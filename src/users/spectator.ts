import { UserType } from "../interfaces/game";
import { User } from "./user";

export class Spectator extends User {
    
    constructor(name:string, socketId:string) {
        super(name, socketId, UserType.Spectator);
    }
}