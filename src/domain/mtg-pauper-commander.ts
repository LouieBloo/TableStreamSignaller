import { Player } from "./users/player";
import { IGameEvent, GameEvent, GameType, IModifyPlayerProperty, PlayerProperties } from "./interfaces/game";
import { Room } from "./rooms/room";
import { Game } from "./game";
import { ResetCommanderDamagesToZero, SetPlayerDefaults, SetCommander, ModifyPlayerCommanderDamage, ModifyPlayerCommanderCastAmount } from './games/services/mtg-commander-service';

export class MTGPauperCommander extends Game {
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
        return this.modifyPlayerProperty(gameEvent)
    }

    return super.event(gameEvent, room);
  }

  modifyPlayerProperty(gameEvent: IGameEvent): Player {
    let modifyEvent: IModifyPlayerProperty = gameEvent.payload;

    switch (modifyEvent.property) {
      case PlayerProperties.commanderCastAmount:
        return ModifyPlayerCommanderCastAmount(gameEvent);
    }

    return super.modifyPlayerProperty(gameEvent);
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