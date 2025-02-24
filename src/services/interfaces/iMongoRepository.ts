import { Room } from "../../domain/rooms/room";
import { IMongoRoom } from "../../infrastructure/mongo/models/room-model";

export interface IMongoRepository {
    deleteRoomAsync(room: Room): Promise<IMongoRoom | null>;
    getRoomsAsync(startDate: Date, endDate: Date): Promise<IMongoRoom[] | null>
}