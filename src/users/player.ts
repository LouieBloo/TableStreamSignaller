import { PlayingCard, slimCard } from "../interfaces/cards";
import { CommanderDamage, UserType } from "../interfaces/game";
import { User } from "./user";
import { Type } from "class-transformer";

export class Player extends User {
    @Type(() => Date)
    currentTurnStartTime: Date;

    turnOrder: number;
    admin:boolean;
    lifeTotal:number;
    isTakingTurn: boolean;
    isDead:boolean = false;
    totalTurns: number;
    totalTurnTime: number;
    isMonarch:boolean = false;
    hasCitiesBlessing:boolean = false;
    poisonTotal:number;
    energyTotal:number;
    commanderDamages: {
        [targetId: string]: {  // target (commander) id
          [playerId: string]: CommanderDamage;  // damage info for each player targeting the commander
        };
      };
    commanders: PlayingCard[] = [];
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

    takeCommanderDamage = (damagingPlayer: Player, amount: number, target: PlayingCard) => {
        // Ensure that the commanderDamages object has an entry for the player and the target
        if (!this.commanderDamages[target.id]) {
          this.commanderDamages[target.id] = {};  // Create a new target entry if it doesn't exist
        }
      
        // Initialize the player's damage to the target if it doesn't exist
        if (!this.commanderDamages[target.id][damagingPlayer.id]) {
          this.commanderDamages[target.id][damagingPlayer.id] = {
            playerId: damagingPlayer.id,
            damage: 0, // Initialize damage dealt by this player to the target
          };
        }
      
        // Add the damage to the player's damage total for this specific target (commander)
        this.commanderDamages[target.id][damagingPlayer.id].damage += amount;
      
        // Prevent negative commander damage (to avoid mistakes)
        if (this.commanderDamages[target.id][damagingPlayer.id].damage < 0) {
          this.commanderDamages[target.id][damagingPlayer.id].damage = 0;
        } else {
          // If the damage is positive, subtract it from the target's (commander's) life total
          target.lifeTotal -= amount;
        }
      
        // Check if the player has dealt 21 or more damage to the commander (threshold for game)
        if (this.commanderDamages[target.id][damagingPlayer.id].damage >= 21) {
          // Set the target's life total to 0, "killing" the target (commander)
          target.lifeTotal = 0;
          console.log(`${damagingPlayer.name} has dealt 21 or more damage to ${target.name}! ${target.name} is dead.`);
        }
      
        return this;
      };

    //how can we know what type is coming in?
    setCommander = (payload: any)=>{
        console.log(this.commanders);
        if(this.commanders.length < 2){
            this.commanders.push(slimCard(payload))
        } else {
            throw new Error("Cannot have more than 2 commanders")
        }

    }

 }