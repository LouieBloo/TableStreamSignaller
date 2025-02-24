import { MongoAnalytic } from "../../domain/interfaces/iMongoAnalytic";
import { Room } from "../../domain/rooms/room";
import { IMongoRoom } from "../../infrastructure/mongo/models/room-model";

export interface IMongoService {
    deleteRoom(room: Room): Promise<IMongoRoom | null>;
    getTwoMonthsAnalytics(): Promise<MongoAnalytic[]>
}