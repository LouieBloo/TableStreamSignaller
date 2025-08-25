import { Player } from "../users/player";
import { IGameEvent, GameEvent, PlayerProperties, IModifyPlayerProperty } from "../interfaces/IGame";
import { Room } from "../rooms/room";
import { Game } from "./game";
import {  ModifyPlayerCommanderCastAmount } from '../games/services/mtg-commander-service';

export class MTGGame extends Game {

  constructor() {
    super();
  }

  public event(gameEvent: IGameEvent, room: Room): any {
    switch (gameEvent.event) {
      case GameEvent.ToggleMonarch:
        return this.toggleMonarch(gameEvent, room);
      case GameEvent.ToggleInitiative:
        return this.toggleInitiative(gameEvent, room);
      case GameEvent.ModifyPlayerProperty:
        return this.modifyPlayerProperty(gameEvent, room)
    }

    return super.event(gameEvent, room);
  }

  modifyPlayerProperty(gameEvent: IGameEvent, room: Room): Player[] {
    this.modifyPlayerPropertySecurityCheck(gameEvent);

    const modifyEvent: IModifyPlayerProperty = gameEvent.payload;
    const callingPlayer = gameEvent.callingPlayer;
    const amountToModify = modifyEvent.amountToModify

    switch (modifyEvent.property) {
      case PlayerProperties.commanderCastAmount:
        return [ModifyPlayerCommanderCastAmount(gameEvent)];
      case PlayerProperties.poisonTotal:
        callingPlayer.poisonTotal += amountToModify;
        if (callingPlayer.poisonTotal < 0) { callingPlayer.poisonTotal = 0; }
        return [callingPlayer];
      case PlayerProperties.energyTotal:
        callingPlayer.energyTotal += amountToModify;
        if (callingPlayer.energyTotal < 0) { callingPlayer.energyTotal = 0; }
        return [callingPlayer];
      case PlayerProperties.citiesBlessing:
        callingPlayer.hasCitiesBlessing = !callingPlayer.hasCitiesBlessing;
        return [callingPlayer];
      case PlayerProperties.radiationTotal:
        callingPlayer.radiationTotal += amountToModify;
        if (callingPlayer.radiationTotal < 0) { callingPlayer.radiationTotal = 0; }
        return [callingPlayer];
    }

    return super.modifyPlayerProperty(gameEvent, room);
  }

  // This is not a player property event as it changes multiple players
  toggleInitiative = (gameEvent: IGameEvent, room: Room) => {
    this.modifyPlayerPropertySecurityCheck(gameEvent);

    if (gameEvent.callingPlayer.hasInitiative) {
      gameEvent.callingPlayer.hasInitiative = false;
    } else {
      room.players.forEach(player => {
        if (player.id == gameEvent.callingPlayer.id) {
          player.hasInitiative = true;
        } else {
          player.hasInitiative = false;
        }
      })
    }

    return room.players;
  }

  // This is not a player property event as it changes multiple players
  toggleMonarch = (gameEvent: IGameEvent, room: Room) => {
    this.modifyPlayerPropertySecurityCheck(gameEvent);

    if (gameEvent.callingPlayer.isMonarch) {
      gameEvent.callingPlayer.isMonarch = false;
    } else {
      room.players.forEach(player => {
        if (player.id == gameEvent.callingPlayer.id) {
          player.isMonarch = true;
        } else {
          player.isMonarch = false;
        }
      })
    }

    return room.players;
  }
}