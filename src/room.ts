import { IMessage } from "./interfaces/messaging";
import { Player } from "./player";


export class Room {
  name: string;
  messages: IMessage[];
  players: Player[];

  constructor(roomName:string) {
    this.name = roomName;
    this.messages = [];
    this.players = [];
  }


  public addPlayer(playerName: string, socketId:string) {
    //check for duplicate player names
    let player = this.players.find(e => e.name === playerName);

    if (!player) {
      player = new Player(playerName,socketId,this.players.length);
      this.players.push(player)
    }else{
      player.socketId = socketId;
    }

    return player;
  }

  public addMessage(socketId:string, message:string):IMessage | null {
    const targetPlayer = this.getPlayer(socketId);

    if(targetPlayer){
      let newMessage = {
        text: message,
        player: targetPlayer
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
}