import { Room } from "../../domain/rooms/room";

export interface IRedisRepository {
    getRoomUnsafe(roomId:string): Promise<Room|null>;
    saveRoomAndUnlock(room: Room, setScheduledTTL: boolean): Promise<void>;
    deleteRoomAndUnlock(room: Room): Promise<void>;
    unlockRoom(lock: any): Promise<void>;
    isRoomPasswordProtected(roomId:string):Promise<boolean>;
    getAllRooms(): Promise<any[]>;
    lockRoomAndGetState(roomId: string): Promise<Room>
}