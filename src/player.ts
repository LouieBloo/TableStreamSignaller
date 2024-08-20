const { v4: uuidv4 } = require('uuid');

export class Player {
    name: string;
    socketId: string;
    id: string;
    turnOrder: number;
    admin:boolean;
    lifeTotal:number;

    constructor(name:string, socketId:string, turnOrder:number, startingLifeTotal:number) {
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.turnOrder = turnOrder;
        this.lifeTotal = startingLifeTotal;
    }
 }