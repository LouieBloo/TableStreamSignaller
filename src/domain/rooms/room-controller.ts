import { GameType } from "../interfaces/game";
import { ICreateRoomParams, RoomState } from "./roomState";

export interface IRoomCreationResponse{
    roomName: string;
    roomId:string;
    roomUrl:string;
    gameType:string;
    maxPlayers:number;
    password?:string;
    scheduledRoom?:boolean;
    allowPlayerKicking?:boolean;
}

export const createRoom = async(params:ICreateRoomParams):Promise<IRoomCreationResponse>=>{

    if(params.initialScheduleTTLInSeconds && params.initialScheduleTTLInSeconds > 86400){
        throw({error: "Schedule TTL too long, maximum time is 24 hours"});
    }
    if(!params.roomName || (params.roomName.length > 100)){
        throw({error: "Room name must be between 1 and 100 chars"});
    }
    if(params.maxPlayers && (params.maxPlayers > 6 || params.maxPlayers < 1)){
        throw({error: "Max players must be between 1 and 6"});
    }
    if(!params.gameType){
        throw({error: "Invalid gameType"});
    }
    if(params.password && params.password.length > 100){
        throw({error: "Password too long, must be < 100 chars"});
    }

    const roomState = new RoomState();
    let newRoom = await roomState.getOrCreateRoom(params);
    //save room in redis
    await newRoom.saveAndClose(params.scheduledRoom);

    const response:IRoomCreationResponse = {
        roomName: newRoom.name,
        roomId: newRoom.id,
        roomUrl: process.env.APP_URL + "/game?id=" + newRoom.id,
        gameType: GameType[newRoom.game.gameType].toString(),
        maxPlayers: newRoom.maxPlayers,
        password: newRoom.password,
        allowPlayerKicking: newRoom.allowPlayerKicking
    }

    return response;
}
