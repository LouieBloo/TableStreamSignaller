import { UserType } from "../interfaces/game";

const { v4: uuidv4 } = require('uuid');

export class User {
    name: string;
    socketId: string;
    id: string;

    type: UserType;

    constructor(name:string, socketId:string, type:UserType) {
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.type = type;
    }
}