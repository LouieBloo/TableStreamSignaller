import { CommanderDamage } from "./interfaces/game";

const { v4: uuidv4 } = require('uuid');

export class Player {
    name: string;
    socketId: string;
    id: string;
    turnOrder: number;
    admin:boolean;
    lifeTotal:number;

    isTakingTurn: boolean;
    totalTurns: number;
    currentTurnStartTime: Date;
    totalTurnTime: number;

    isMonarch:boolean = false;

    poisonTotal:number;

    commanderDamages: { [playerId: string]: CommanderDamage } = {};

    constructor(name:string, socketId:string, turnOrder:number, startingLifeTotal:number) {
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.turnOrder = turnOrder;
        this.lifeTotal = startingLifeTotal;
        this.poisonTotal = 0;

        this.totalTurns = 0;
        this.totalTurnTime = 0;
    }


    takeCommanderDamage = (damagingPlayer: Player, amount: number)=>{
        if(this.commanderDamages[damagingPlayer.id]){
            this.commanderDamages[damagingPlayer.id].damage += amount;
        }else{
            this.commanderDamages[damagingPlayer.id] = {
                playerId: damagingPlayer.id,
                damage: amount
            }
        }

        this.lifeTotal -= amount;

        if(this.commanderDamages[damagingPlayer.id].damage >= 20){
            this.lifeTotal = 0;
        }

        return this;
    }
 }