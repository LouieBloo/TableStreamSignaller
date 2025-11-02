import { IPlayingCard, slimCard } from "../interfaces/ICards";
import { GameEvent, GameType, IGameEvent, IModifyPlayerProperty, PlayerProperties } from "../interfaces/IGame";
import { Room } from "../rooms/room";
import { Player } from "../users/player";
import { Game } from "./game";

export class OnePiece extends Game {
  startingLifeTotal = 5;
  gameType: GameType = GameType.OnePiece;

  constructor() {
    super();
  }

  public event(gameEvent: IGameEvent, room: Room): any {
    switch (gameEvent.event) {
      case GameEvent.ModifyPlayerProperty:
        return this.modifyPlayerProperty(gameEvent, room)
      case GameEvent.StartGame:
        return this.startGame(room);
      case GameEvent.SetCommander:
        return this.setCommander(gameEvent, room);
    }

    return super.event(gameEvent, room);
  }

  startGame(room: Room): Room {
    super.startGame(room);

    for (let x = 0; x < room.players.length; x++) {
      room.players[x].lifeTotal = room.players[x].commanders && room.players[x].commanders.length > 0 ? room.players[x].commanders[0].life_total : this.startingLifeTotal;
    }

    return room;
  }

  modifyPlayerProperty(gameEvent: IGameEvent, room: Room): Player[] {
    this.modifyPlayerPropertySecurityCheck(gameEvent);

    let modifyEvent: IModifyPlayerProperty = gameEvent.payload;

    switch (modifyEvent.property) {
      case PlayerProperties.commanderCastAmount:
        return [this.modifyPlayerCommanderCastAmount(gameEvent)];
    }

    return super.modifyPlayerProperty(gameEvent, room);
  }

  setPlayerDefaults(newPlayer: Player, room: Room) {
    super.setPlayerDefaults(newPlayer, room);

    newPlayer.commanders = []
  }


  setCommander = (gameEvent: IGameEvent, room: Room) => {
    let newCommander: IPlayingCard = gameEvent.payload.card ? slimCard(gameEvent.payload.card) : null;
    gameEvent.callingPlayer.commanders[gameEvent.payload.index] = newCommander;
    gameEvent.callingPlayer.commanders[gameEvent.payload.index].castAmount = 0;
    gameEvent.callingPlayer.lifeTotal = newCommander.life_total;

    //I dont like this but it keeps parity with mtg 
    return room.players;
  }

  modifyPlayerCommanderCastAmount = (gameEvent: IGameEvent): Player => {
    gameEvent.callingPlayer.commanders.forEach((commander: IPlayingCard) => {
      if (commander.id == gameEvent.payload.commander.id) {
        commander.castAmount += gameEvent.payload.amountToModify;
        if (commander.castAmount < 0) {
          commander.castAmount = 0;
        }
      }
    })
    return gameEvent.callingPlayer;
  }

}
