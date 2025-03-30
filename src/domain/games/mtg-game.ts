import { Player } from "../users/player";
import { IGameEvent, GameEvent, GameType, PlayerProperties, IModifyPlayerProperty, GameError, GameErrorSeverity, GameErrorType } from "../interfaces/IGame";
import { Room } from "../rooms/room";
import { Game } from "./game";
import { ResetCommanderDamagesToZero, SetPlayerDefaults, SetCommander, ModifyPlayerCommanderDamage, RemoveCommanderDamagesFromPlayer, ModifyPlayerCommanderCastAmount } from '../games/services/mtg-commander-service';
import { IKickPlayerResponse } from "../interfaces/IKickPlayerReponse";

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
        return this.modifyPlayerProperty(gameEvent)
    }

    return super.event(gameEvent, room);
  }

  modifyPlayerProperty(gameEvent: IGameEvent): Player {
    this.modifyPlayerPropertySecurityCheck(gameEvent);

    let modifyEvent: IModifyPlayerProperty = gameEvent.payload;

    switch (modifyEvent.property) {
      case PlayerProperties.commanderCastAmount:
        return ModifyPlayerCommanderCastAmount(gameEvent);
      case PlayerProperties.poisonTotal:
        gameEvent.callingPlayer.poisonTotal += modifyEvent.amountToModify;
        if (gameEvent.callingPlayer.poisonTotal < 0) { gameEvent.callingPlayer.poisonTotal = 0; }
        return gameEvent.callingPlayer;
      case PlayerProperties.energyTotal:
        gameEvent.callingPlayer.energyTotal += modifyEvent.amountToModify;
        if (gameEvent.callingPlayer.energyTotal < 0) { gameEvent.callingPlayer.energyTotal = 0; }
        return gameEvent.callingPlayer;
      case PlayerProperties.citiesBlessing:
        gameEvent.callingPlayer.hasCitiesBlessing = !gameEvent.callingPlayer.hasCitiesBlessing;
        return gameEvent.callingPlayer;
    }

    return super.modifyPlayerProperty(gameEvent);
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