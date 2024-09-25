import { Game } from "./games/game";
import { GameError, GameErrorType, GameType, IGameEvent } from "./interfaces/game";
import { IMessage } from "./interfaces/messaging";
import { Player } from "./users/player";
import { MTGCommander } from "./games/mtg-commander";
import { Spectator } from "./users/spectator";
import { saveRoomAndUnlock, unlockRoom } from "./redis";
import { Type } from "class-transformer";
import { MTGStandard } from "./games/mtg-standard";
import { MTGModern } from "./games/mtg-modern";
import { MTGVintage } from "./games/mtg-vintage";
import { MTGLegacy } from "./games/mtg-legacy";
const { v4: uuidv4 } = require('uuid');

export class Room {
  name: string;

  messages: IMessage[];

  @Type(() => Player)
  players: Player[];

  @Type(() => Spectator)
  spectators: Spectator[];

  @Type(() => Game)
  game: Game;

  playerSockets: string[] = [];
  spectatorSockets: string[] = [];

  redisLock: any;

  id: string;
  password:string;

  constructor(roomName: string,password:string, gameType: GameType) {
    this.id = uuidv4();
    this.name = roomName;
    this.messages = [];
    this.players = [];
    this.spectators = [];
    this.password = password;

    this.game = Room.createGame(gameType);
  }

  saveAndClose = async () => {
    saveRoomAndUnlock(this);
  }

  close = async () => {
    unlockRoom(this.redisLock);
  }

  static createGame(gameType: GameType) {
    if (typeof gameType === 'string') {
      gameType = Number(gameType);
    }
    switch (gameType) {
      case GameType.MTGCommander:
        return new MTGCommander();
        break;
      case GameType.MTGStandard:
        return new MTGStandard();
        break;
      case GameType.MTGModern:
        return new MTGModern();
        break;
      case GameType.MTGVintage:
        return new MTGVintage();
        break;
      case GameType.MTGLegacy:
        return new MTGLegacy();
        break;
    }
  }

  public verifyPassword(password:string): boolean{
    return this.password === password;
  }

  public addPlayer(playerId: string, playerName: string, socketId: string, password:string): Player {
    let player = this.players.find(e => e.id === playerId);

    if (!player) {
      //we only check password on new players
      if(this.password && !this.verifyPassword(password)){
        throw new GameError(GameErrorType.InvalidPassword, "Invalid Password");
      }

      player = new Player(playerName, socketId, this.players.length, this.game.startingLifeTotal);
      if (this.players.length == 0) {
        player.admin = true;
      }

      this.players.push(player)
    } else {
      player.socketId = socketId;
    }

    return player;
  }

  public addSpectator(playerId: string, spectatorName: string, socketId: string, password:string): Spectator {
    let spectator = this.spectators.find(e => e.id === playerId);

    if (!spectator) {
      //we only check password on new spectators
      if(this.password && !this.verifyPassword(password)){
        throw new GameError(GameErrorType.InvalidPassword, "Invalid Password");
      }

      spectator = new Spectator(spectatorName, socketId);
      this.spectators.push(spectator)
    } else {
      spectator.socketId = socketId;
    }

    return spectator;
  }

  public userDisconnected(socketId: string) {
    this.playerSockets = this.playerSockets.filter((id: any) => id !== socketId);
    this.spectatorSockets = this.spectatorSockets.filter((id: any) => id !== socketId);
  }

  public getAllSocketIds(): string[] {
    return this.playerSockets.concat(this.spectatorSockets);
  }

  public addMessage(socketId: string, message: string): IMessage | null {
    const targetPlayer: Player = this.getPlayer(socketId);

    if (targetPlayer) {
      let newMessage = {
        text: message,
        player: { name: targetPlayer.name, id: targetPlayer.id },
        date: new Date()
      }
      this.messages.push(newMessage)
      return newMessage;
    } else {
      return null;
    }
  }

  getPlayer(socketId: string) {
    return this.players.find(p => p.socketId === socketId);
  }

  gameEvent(socketId: string, gameEvent: IGameEvent): any {
    gameEvent.callingPlayer = this.getPlayer(socketId);
    if (gameEvent.callingPlayer) {
      return this.game.event(gameEvent, this);
    } else {
      throw new GameError(GameErrorType.InvalidAction, "You cant make that action");
    }
  }
}