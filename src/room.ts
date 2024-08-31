import { Game } from "./games/game";
import { GameType, IGameEvent } from "./interfaces/game";
import { IMessage } from "./interfaces/messaging";
import { Player } from "./users/player";
import {MTGCommander} from "./games/mtg-commander";
import { Spectator } from "./users/spectator";


export class Room {
  name: string;
  messages: IMessage[];
  players: Player[];
  spectators: Spectator[];
  game: Game;

  playerSockets: string[] = [];
  spectatorSockets: string[] = [];

  constructor(roomName:string, gameType:GameType) {
    this.name = roomName;
    this.messages = [];
    this.players = [];
    this.spectators = [];

    this.game = this.createGame(gameType);
  }

  createGame(gameType: GameType){
    switch(gameType){
      case GameType.MTGCommander:
        return new MTGCommander();
        break;
    }
  }

  public addPlayer(playerName: string, socketId:string):Player {
    //check for duplicate player names
    let player = this.players.find(e => e.name === playerName);

    if (!player) {
      player = new Player(playerName, socketId, this.players.length, this.game.startingLifeTotal);
      if(this.players.length == 0){
        player.admin = true;
      }

      this.players.push(player)
    }else{
      player.socketId = socketId;
    }

    return player;
  }

  public addSpectator(spectatorName: string, socketId:string):Spectator {
    //check for duplicate player names
    let spectator = this.spectators.find(e => e.name === spectatorName);

    if (!spectator) {
      spectator = new Spectator(spectatorName, socketId);
      this.spectators.push(spectator)
    }else{
      spectator.socketId = socketId;
    }

    return spectator;
  }

  public userDisconnected(socketId:string){
    this.playerSockets = this.playerSockets.filter((id:any) => id !== socketId);
    this.spectatorSockets = this.spectatorSockets.filter((id:any) => id !== socketId);
  }

  public getAllSocketIds():string[]{
    return this.playerSockets.concat(this.spectatorSockets);
  }

  public addMessage(socketId:string, message:string):IMessage | null {
    const targetPlayer = this.getPlayer(socketId);

    if(targetPlayer){
      let newMessage = {
        text: message,
        player: targetPlayer,
        date: new Date()
      }
      this.messages.push(newMessage)
      return newMessage;
    }else{
      return null;
    }
  }

  getPlayer(socketId:string){
    return this.players.find(p => p.socketId === socketId);
  }

  gameEvent(socketId: string, gameEvent: IGameEvent):any{
    gameEvent.callingPlayer = this.getPlayer(socketId);
    return this.game.event(gameEvent,this);
  }
}