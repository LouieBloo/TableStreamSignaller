import { IPlayingCard } from "../interfaces/ICards";
import { ICommanderDamage, UserType } from "../interfaces/IGame";
import { User } from "./user";
import { Type } from "class-transformer";
const { v4: uuidv4 } = require("uuid");

export class Player extends User {
  turnOrder: number;
  isAdmin: boolean;
  lifeTotal: number;
  isTakingTurn: boolean;
  isDead: boolean = false;
  totalTurns: number;
  @Type(() => Date)
  currentTurnStartTime: Date;
  totalTurnTime: number;

  @Type(() => Date)
  lastEffectTime: Date;

  isMonarch: boolean = false;
  isSharingImages: boolean = true;
  hasCitiesBlessing: boolean = false;
  hasInitiative: boolean = false;
  poisonTotal: number;
  energyTotal: number;
  radiationTotal: number;
  roomId: string;
  ipAddress: string;


  commanderDamages: {
    [playerId: string]: { [cardId: string]: ICommanderDamage };
  } = {};
  commanders: IPlayingCard[];

  prizeCards: number = 0;
  qrCodeToken: string; //can this be typed?
  constructor(
    name: string,
    socketId: string,
    turnOrder: number,
    startingLifeTotal: number,
    roomId: string,
    ipAddress: string,
    isSharingImages: boolean,
  ) {
    super(name, socketId, UserType.Player);

    this.turnOrder = turnOrder;
    this.lifeTotal = startingLifeTotal;
    this.poisonTotal = 0;
    this.energyTotal = 0;
    this.radiationTotal = 0;
    this.totalTurns = 0;
    this.totalTurnTime = 0;
    this.roomId = roomId;
    this.ipAddress = ipAddress;
    this.isSharingImages = isSharingImages == false ? false: true;
    console.log("roomId: " + this.roomId);

  }

  takeCommanderDamage = (
    damagingPlayer: Player,
    amount: number,
    card: IPlayingCard,
    maxCommanderDamageUntilDead: number
  ) => {
    //add or create the commander damage for this player
    this.commanderDamages[damagingPlayer.id][card.id].damage += amount;

    //prevent negative commander damage
    if (this.commanderDamages[damagingPlayer.id][card.id].damage < 0) {
      this.commanderDamages[damagingPlayer.id][card.id].damage = 0;
    } else {
      //remove lifetotal on commander damage
      this.lifeTotal -= amount;
    }

    //kill player if threshold met
    if (
      this.commanderDamages[damagingPlayer.id][card.id].damage >=
      maxCommanderDamageUntilDead
    ) {
      this.lifeTotal = 0;
      this.isDead = true;
    } else if (this.lifeTotal > 0) {
      this.isDead = false;
    }

    return this;
  };

  setAdmin(isAdmin: boolean) {
    this.isAdmin = isAdmin;
  }

  setQrCodeToken() {
    const token = uuidv4();
    this.qrCodeToken = token;
    return token;
  }
}
