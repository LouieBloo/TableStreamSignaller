import { PlayingCard } from "../interfaces/cards";
import { CommanderDamage, UserType } from "../interfaces/game";
import { User } from "./user";
import { Type } from "class-transformer";

export class Player extends User {
    turnOrder: number;
    admin:boolean;

    lifeTotal:number;
    isTakingTurn: boolean;
    isDead:boolean = false;
    totalTurns: number;
    @Type(() => Date)
    currentTurnStartTime: Date;
    totalTurnTime: number;

    @Type(() => Date)
    lastEffectTime:Date;

    isMonarch:boolean = false;
    isSharingImages:boolean = true;
    hasCitiesBlessing:boolean = false;

    poisonTotal:number;
    energyTotal:number;

    commanderDamages: { [playerId: string]: { [cardId: string]: CommanderDamage } } = {};

    commanders: PlayingCard[];

    prizeCards:number = 0;

    constructor(name:string, socketId:string, turnOrder:number, startingLifeTotal:number) {
        super(name,socketId,UserType.Player);

        this.turnOrder = turnOrder;
        this.lifeTotal = startingLifeTotal;
        this.poisonTotal = 0;
        this.energyTotal = 0;

        this.totalTurns = 0;
        this.totalTurnTime = 0;
    }


    takeCommanderDamage = (damagingPlayer: Player, amount: number, card:PlayingCard, maxCommanderDamageUntilDead:number)=>{
        //add or create the commander damage for this player
        this.commanderDamages[damagingPlayer.id][card.id].damage += amount;

        //prevent negative commander damage
        if(this.commanderDamages[damagingPlayer.id][card.id].damage < 0){
            this.commanderDamages[damagingPlayer.id][card.id].damage = 0;
        }else{
            //remove lifetotal on commander damage
            this.lifeTotal -= amount;
        }

        //kill player if threshold met
        if(this.commanderDamages[damagingPlayer.id][card.id].damage >= maxCommanderDamageUntilDead){
            this.lifeTotal = 0;
            this.isDead = true;
        }else if(this.lifeTotal > 0){
            this.isDead = false;
        }

        return this;
    }
 }