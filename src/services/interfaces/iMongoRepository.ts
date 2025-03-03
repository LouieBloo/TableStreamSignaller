import { IMongoRoom } from "../../infrastructure/mongo/models/room-model";

export interface IMongoRepository {
    deleteRoomAsync(id: string): Promise<IMongoRoom | null>;
    getRoomsAsync(startDate: Date, endDate: Date): Promise<IMongoRoom[] | null>;
    addRoomMongo(roomData: Partial<IMongoRoom>): Promise<IMongoRoom>;
    updateRoomMongo(tableStreamRoomId: string, updates: Partial<IMongoRoom>): Promise<IMongoRoom | null>
}