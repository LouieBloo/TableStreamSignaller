import { Player } from "../users/player";
import { IGameEvent, GameEvent, GameType, IModifyPlayerProperty, PlayerProperties } from "../interfaces/IGame";
import { Room } from "../rooms/room";
import { ResetCommanderDamagesToZero, SetPlayerDefaults, SetCommander, ModifyPlayerCommanderDamage, ModifyPlayerCommanderCastAmount } from '../games/services/mtg-commander-service';
import { MTGGame } from "./mtg-game";

export class MTGPauperCommander extends MTGGame {
  startingLifeTotal = 30;
  maxCommanderDamageUntilDead: number = 16;

  gameType: GameType = GameType.MTGPauperCommander;

  constructor() {
    super();
  }

  public event(gameEvent: IGameEvent, room: Room): any {
    switch (gameEvent.event) {
      case GameEvent.StartGame:
        return this.startGame(room);
      case GameEvent.ResetGame:
        return this.startGame(room);
      case GameEvent.ModifyPlayerCommanderDamage:
        return this.modifyPlayerCommanderDamage(gameEvent);
      case GameEvent.SetCommander:
        return this.setCommander(gameEvent, room);
      case GameEvent.ModifyPlayerProperty:
        return this.modifyPlayerProperty(gameEvent, room)
    }

    return super.event(gameEvent, room);
  }

  modifyPlayerProperty(gameEvent: IGameEvent, room: Room): Player[] {
    this.modifyPlayerPropertySecurityCheck(gameEvent);

    let modifyEvent: IModifyPlayerProperty = gameEvent.payload;

    switch (modifyEvent.property) {
      case PlayerProperties.commanderCastAmount:
        return [ModifyPlayerCommanderCastAmount(gameEvent)];
    }

    return super.modifyPlayerProperty(gameEvent, room);
  }

  startGame(room: Room): Room {
    super.startGame(room);

    return ResetCommanderDamagesToZero(room);
  }

  setPlayerDefaults(newPlayer: Player, room: Room) {
    super.setPlayerDefaults(newPlayer, room);

    SetPlayerDefaults(newPlayer, room);
  }

  setCommander = (gameEvent: IGameEvent, room: Room) => {
    return SetCommander(gameEvent, room);
  }

  modifyPlayerCommanderDamage = (gameEvent: IGameEvent) => {
    return ModifyPlayerCommanderDamage(gameEvent, this.maxCommanderDamageUntilDead);
  }

}