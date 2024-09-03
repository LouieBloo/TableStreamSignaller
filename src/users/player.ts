import { ScryfallCard } from "../interfaces/cards";
import { CommanderDamage, UserType } from "../interfaces/game";
import { User } from "./user";

export class Player extends User {
    turnOrder: number;
    admin:boolean;

    lifeTotal:number;
    isTakingTurn: boolean;
    totalTurns: number;
    currentTurnStartTime: Date;
    totalTurnTime: number;

    isMonarch:boolean = false;

    poisonTotal:number;
    energyTotal:number;

    commanderDamages: { [playerId: string]: CommanderDamage } = {};

    commander: ScryfallCard;

    constructor(name:string, socketId:string, turnOrder:number, startingLifeTotal:number) {
        super(name,socketId,UserType.Player);

        this.turnOrder = turnOrder;
        this.lifeTotal = startingLifeTotal;
        this.poisonTotal = 0;
        this.energyTotal = 0;

        this.totalTurns = 0;
        this.totalTurnTime = 0;
    }


    takeCommanderDamage = (damagingPlayer: Player, amount: number)=>{
        //add or create the commander damage for this player
        if(this.commanderDamages[damagingPlayer.id]){
            this.commanderDamages[damagingPlayer.id].damage += amount;
        }else{
            this.commanderDamages[damagingPlayer.id] = {
                playerId: damagingPlayer.id,
                damage: amount
            }
        }

        //prevent negative commander damage
        if(this.commanderDamages[damagingPlayer.id].damage < 0){
            this.commanderDamages[damagingPlayer.id].damage = 0;
        }else{
            //remove lifetotal on commander damage
            this.lifeTotal -= amount;
        }

        //kill player if threshold met
        if(this.commanderDamages[damagingPlayer.id].damage >= 21){
            this.lifeTotal = 0;
        }

        return this;
    }
 }