import { PlayingCard, slimCard } from "../interfaces/cards";
import { CommanderDamage, UserType } from "../interfaces/game";
import { User } from "./user";
import { Type } from "class-transformer";

export class Player extends User {
  @Type(() => Date)
  currentTurnStartTime: Date;

  readonly MAX_COMMANDER_LIFE = 21;
  turnOrder: number;
  admin: boolean;
  lifeTotal: number;
  isTakingTurn: boolean;
  isDead: boolean = false;
  totalTurns: number;
  totalTurnTime: number;
  isMonarch: boolean = false;
  hasCitiesBlessing: boolean = false;
  poisonTotal: number;
  energyTotal: number;
  commanderDamages: any = {};

  //   commanderDamages: any = {
  //     commanderId1: {
  //       opponentId1: 25,
  //       opponentId2: 20,
  //     },
  //     commanderId2: {
  //       opponentId1: 25,
  //       opponentId2: 20,
  //     },
  //   };

  commanders: PlayingCard[] = [];
  prizeCards: number = 0;

  constructor(
    name: string,
    socketId: string,
    turnOrder: number,
    startingLifeTotal: number
  ) {
    super(name, socketId, UserType.Player);

    this.turnOrder = turnOrder;
    this.lifeTotal = startingLifeTotal;
    this.poisonTotal = 0;
    this.energyTotal = 0;
    this.totalTurns = 0;
    this.totalTurnTime = 0;
  }

  takeCommanderDamage = (
    damagingPlayer: Player,
    damage: number,
    target: PlayingCard
  ) => {
    const targetId = target.id;
    const damagingPlayerId = damagingPlayer.id;
    const targetCommander = this.commanderDamages[targetId];

    let currentDamage = targetCommander[damagingPlayerId] || 0;
    currentDamage += damage;

    if (currentDamage < 0) {
      currentDamage = 0;
    }

    targetCommander[damagingPlayerId] = currentDamage;

    if (targetCommander[damagingPlayerId]) {
      targetCommander[damagingPlayerId] += damage;
    } else {
      targetCommander[damagingPlayerId] = damage;
    }

    if (damage > 0) {
      this.lifeTotal -= damage;
    }

    if (currentDamage >= this.MAX_COMMANDER_LIFE) {
      this.killPlayer();
    }

    return this;
  };

  killPlayer() {
    this.lifeTotal = 0;
  }

  //   payload:
  //   {
  //     newCommander,
  //     oldCommander
  //   }

  setCommander = (payload: any) => {
    const newCommander = payload.newCommander;
    const oldCommander = payload.oldCommander;
    let oldCommanderIndex;
    if(oldCommander){
        oldCommanderIndex = this.commanders.findIndex(
            (commander) => commander.id == oldCommander.id
          );
    }


    if (oldCommanderIndex > -1) {
      this.commanders[oldCommanderIndex] = slimCard(newCommander);
    } else {
      if (this.commanders.length < 2) {
        this.commanders.push(slimCard(newCommander));
      } else {
        throw new Error("Cannot have more than 2 commanders");
      }
    }
  };
}
