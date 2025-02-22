import { Room } from "../../domain/rooms/room";
import MongoRoom, { IMongoRoom } from "../../infrastructure/mongo/models/room-model";
import { IMongoRepository } from "../../services/interfaces/IMongoRepository";

export class MongoRepository implements IMongoRepository {

  async getRoomsAsync(startDate: Date, endDate: Date): Promise<IMongoRoom[] | null> {
    const mongoRooms = await MongoRoom.find({
      createdAt: { $gte: startDate, $lte: endDate },
      scheduledRoom: false,
      playerIds: { $exists: true, $type: "array", $not: { $size: 1 } },
    });

    return mongoRooms;
  }

  async deleteRoomAsync(room: Room): Promise<IMongoRoom | null> {
    try {
      return await MongoRoom.findOneAndUpdate(
        { tableStreamId: room.id },
        { deletedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error("Error deleting mongo room: ", error);
    }
  }

  
}
