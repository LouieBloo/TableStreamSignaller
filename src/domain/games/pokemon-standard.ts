import { Room } from "../rooms/room";
import { GameError, GameErrorSeverity, GameErrorType, GameEvent, GameType, IGameEvent, IModifyPlayerProperty, PlayerProperties } from "../interfaces/IGame";
import { Game } from "./game";
import { Player } from "../users/player";

export class PokemonStandard extends Game {
  startingLifeTotal = 0;
  gameType: GameType = GameType.PokemonStandard;
  prizeCardsToWin: number = 6;

  constructor() {
    super();
  }

  public event(gameEvent: IGameEvent, room: Room): any {
    switch (gameEvent.event) {
      case GameEvent.ModifyPlayerProperty:
        let modifyEvent: IModifyPlayerProperty = gameEvent.payload;
        if (modifyEvent.property == PlayerProperties.prizeCards) {
          if (!this.active) {
            throw new GameError(GameErrorType.GameNotStarted, "The game has not started yet. Please start the game.", GameErrorSeverity.Error);
          }
          gameEvent.callingPlayer.prizeCards += modifyEvent.amountToModify;
          if (gameEvent.callingPlayer.prizeCards < 0) {
            gameEvent.callingPlayer.prizeCards = 0;
          } else if (gameEvent.callingPlayer.prizeCards > this.prizeCardsToWin) {
            gameEvent.callingPlayer.prizeCards = this.prizeCardsToWin;
          }
          return gameEvent.callingPlayer
        }
    }

    return super.event(gameEvent, room);
  }

  override startGame(room: Room):Room {
    super.startGame(room);
    for (let x = 0; x < room.players.length; x++) {
      room.players[x].prizeCards = this.prizeCardsToWin;
    }
    return room;
  }

  override setPlayerDefaults(player: Player, room:Room) {
    super.setPlayerDefaults(player,room);
    player.prizeCards = this.prizeCardsToWin;
  }
}