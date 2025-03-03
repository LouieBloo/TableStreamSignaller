import { ICreateRoomParams } from "../../domain/interfaces/create-room-params";
import { RedisAnalytic } from "../../domain/interfaces/iRedisAnalytic";
import { Room } from "../../domain/rooms/room";

export interface IRedisService {
    getRedisAnalytic(): Promise<RedisAnalytic>;
    getRoom(roomId:string):Promise<Room>;
    isRoomPasswordProtected(roomId: string):Promise<boolean>;
    getRoomUnsafe(roomId: string): Promise<Room | null>
    deleteRoom(room: Room):Promise<void>;
    getOrCreateRoom(params: ICreateRoomParams): Promise<Room>;
    saveAndClose(room: Room, setScheduledTTL:boolean):Promise<void>;
}