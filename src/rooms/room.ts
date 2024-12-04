import { Game } from "../games/game";
import { GameError, GameErrorSeverity, GameErrorType, GameType, IGameEvent } from "../interfaces/game";
import { IMessage } from "../interfaces/messaging";
import { Player } from "../users/player";
import { MTGCommander } from "../games/mtg-commander";
import { Spectator } from "../users/spectator";
import { saveRoomAndUnlock, unlockRoom } from "../redis";
import { Type } from "class-transformer";
import { MTGStandard } from "../games/mtg-standard";
import { MTGModern } from "../games/mtg-modern";
import { MTGVintage } from "../games/mtg-vintage";
import { MTGLegacy } from "../games/mtg-legacy";
import RoomService from '../mongo/services/room-service';
import { PokemonStandard } from "../games/pokemon-standard";
import { MTGPauperCommander } from "../games/mtg-pauper-commander";

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

  maxPlayers:number = 4;

  playerSockets: string[] = [];
  spectatorSockets: string[] = [];

  redisLock: any;

  id: string;
  password:string;

  scheduledRoom:boolean = false;
  initialScheduleTTLInSeconds: number = 3600;// games waiting to be played will be destroyed after this time
  inactivityTimeUntilDestroyedInSeconds:number = 3600 // 1 hour default

  reactionsEnabled:boolean = true;

  constructor(roomName: string,password:string, gameType: GameType, maxPlayers:number) {
    this.id = uuidv4();
    this.name = roomName;
    this.messages = [];
    this.players = [];
    this.spectators = [];
    this.password = password;
    this.maxPlayers = maxPlayers;

    this.game = Room.createGame(gameType);
  }

  saveAndClose = async (setScheduledTTL:boolean = false) => {
    saveRoomAndUnlock(this,setScheduledTTL);
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
      case GameType.MTGStandard:
        return new MTGStandard();
      case GameType.MTGModern:
        return new MTGModern();
      case GameType.MTGVintage:
        return new MTGVintage();
      case GameType.MTGLegacy:
        return new MTGLegacy();
      case GameType.PokemonStandard:
        return new PokemonStandard();
      case GameType.MTGPauperCommander:
        return new MTGPauperCommander();
    }
  }

  static gameTypeMapping(gameType: string) {
    switch (gameType) {
      case "MTGCommander":
        return GameType.MTGCommander
      case "MTGStandard":
        return GameType.MTGStandard
      case "MTGModern":
        return GameType.MTGModern
      case "MTGVintage":
        return GameType.MTGVintage
      case "MTGLegacy":
        return GameType.MTGLegacy
      case "PokemonStandard":
        return GameType.PokemonStandard;
      case "MTGPauperCommander":
        return GameType.MTGPauperCommander;
    }

    return null;
  }

  public verifyPassword(password:string): boolean{
    return this.password === password;
  }

  public addPlayer(playerId: string, playerName: string, socketId: string, password:string): Player {
    let player = this.players.find(e => e.id === playerId);

    if (!player) {
      //we only check password on new players
      if(this.password && !this.verifyPassword(password)){
        throw new GameError(GameErrorType.InvalidPassword, "Invalid Password",GameErrorSeverity.Error);
      }

      player = new Player(playerName, socketId, this.players.length, this.game.startingLifeTotal);
      if (this.players.length == 0) {
        player.admin = true;
      }

      this.game.setPlayerDefaults(player, this);

      this.players.push(player)

      //send changes to mongo
      RoomService.updateRoom(this);
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
        throw new GameError(GameErrorType.InvalidPassword, "Invalid Password",GameErrorSeverity.Error);
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
    gameEvent.messages = [];
    if (gameEvent.callingPlayer) {
      return this.game.event(gameEvent, this);
    } else {
      throw new GameError(GameErrorType.InvalidAction, "You cant make that action",GameErrorSeverity.Error);
    }
  }

  generateRandomPassword(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
    let password = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
  
    return password;
  }
}