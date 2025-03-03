import { Room } from "../../domain/rooms/room";
import MongoRoom, { IMongoRoom } from "../../infrastructure/mongo/models/room-model";
import { IMongoRepository } from "../../services/interfaces/iMongoRepository";

export class MongoRepository implements IMongoRepository {

  async getRoomsAsync(startDate: Date, endDate: Date): Promise<IMongoRoom[] | null> {
    const mongoRooms = await MongoRoom.find({
      createdAt: { $gte: startDate, $lte: endDate },
      scheduledRoom: false,
      playerIds: { $exists: true, $type: "array", $not: { $size: 1 } },
    });

    return mongoRooms;
  }

  async deleteRoomAsync(id: string): Promise<IMongoRoom | null> {
    try {
      return await MongoRoom.findOneAndUpdate(
        { tableStreamId: id },
        { deletedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error("Error deleting mongo room: ", error);
    }
  }

  async addRoomMongo(roomData: Partial<IMongoRoom>): Promise<IMongoRoom> {
    const room = new MongoRoom(roomData);
    return await room.save();
  }

  async updateRoomMongo(tableStreamRoomId: string, updates: Partial<IMongoRoom>): Promise<IMongoRoom | null> {
    return await MongoRoom.findOneAndUpdate({ tableStreamId: tableStreamRoomId }, updates, { new: true });
  }
  
}
