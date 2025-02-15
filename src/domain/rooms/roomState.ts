import { GameType } from "../interfaces/game";

export interface ICreateRoomParams{
  roomId?:string;
  roomName:string;
  private?:boolean;
  password?:string;
  gameType:GameType;
  maxPlayers?:number;
  scheduledRoom?:boolean;
  initialScheduleTTLInSeconds?:number;
  reactionsEnabled?:boolean;
}

