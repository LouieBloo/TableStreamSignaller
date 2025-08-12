import { Player } from "../users/player";
import { IGameEvent, GameEvent, GameType, PlayerProperties, IModifyPlayerProperty } from "../interfaces/IGame";
import { Room } from "../rooms/room";
import { ResetCommanderDamagesToZero, SetPlayerDefaults, SetCommander, ModifyPlayerCommanderDamage, RemoveCommanderDamagesFromPlayer, ModifyPlayerCommanderCastAmount } from '../games/services/mtg-commander-service';
import { IKickPlayerResponse } from "../interfaces/IKickPlayerReponse";
import { MTGGame } from "./mtg-game";

export class MTGCommander extends MTGGame {
  startingLifeTotal = 40;
  maxCommanderDamageUntilDead: number = 21;

  gameType: GameType = GameType.MTGCommander;

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
      case GameEvent.KickPlayer:
        return this.kickPlayer(gameEvent, room)
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

  kickPlayer = (gameEvent: IGameEvent, room: Room): IKickPlayerResponse => {
    let response: IKickPlayerResponse = super.kickPlayer(gameEvent, room);
    RemoveCommanderDamagesFromPlayer(response.kickedPlayer.id, room)

    response.players = room.players;

    return response
  }

}