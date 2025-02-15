import { Player } from '../domain/users/player';
import { Room } from '../domain/rooms/room';
import MongoRoom, { IMongoRoom } from '../infrastructure/mongo/models/room-model';

const trackingActive = process.env.MONGODB_URI ? true : false;

class RoomService {

  // helper so callers dont need to do any mapping
  async addRoom(room: Room): Promise<IMongoRoom> {
    if (!trackingActive) { return null; }
    try {
      return await this.addRoomMongo(this.mapTableStreamRoomToMongoRoom(room))
    } catch (error) {
      //keep on movin
      console.error("Error adding mongo room: ", error);
    }
  }

  // actually add the room
  private async addRoomMongo(roomData: Partial<IMongoRoom>): Promise<IMongoRoom> {
    if (!trackingActive) { return null; }

    const room = new MongoRoom(roomData);
    return await room.save();
  }

  // helper so callers dont need to do any mapping
  async updateRoom(room: Room): Promise<IMongoRoom | null> {
    if (!trackingActive) { return null; }
    try {
      return await this.updateRoomMongo(room.id, this.mapTableStreamRoomToMongoRoom(room))
    } catch (error) {
      //keep on movin
      console.error("Error updating mongo room: ", error);
    }
  }

  // actually update the room
  async updateRoomMongo(tableStreamRoomId: string, updates: Partial<IMongoRoom>): Promise<IMongoRoom | null> {
    if (!trackingActive) { return null; }

    return await MongoRoom.findOneAndUpdate({ tableStreamId: tableStreamRoomId }, updates, { new: true });
  }

  // Delete a room
  async deleteRoom(room: Room): Promise<IMongoRoom | null> {
    if (!trackingActive) { return null; }
    try {
      return await MongoRoom.findOneAndUpdate(
        { tableStreamId: room.id },
        { deletedAt: new Date() }, // Set deletedAt timestamp
        { new: true }
      );
    } catch (error) {
      //keep on movin
      console.error("Error deleting mongo room: ", error);
    }
  }

  // Delete all rooms with less than 2 playerIds
  async deleteEmptyOrSinglePlayerRooms(): Promise<number | void> {
    if (!trackingActive) { return; }
    try {
      const result = await MongoRoom.deleteMany({
        playerIds: { $exists: true, $type: "array", $size: 1 }
      });
      console.log(`Deleted ${result.deletedCount} rooms with less than 2 players.`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error deleting rooms with less than 2 players: ", error);
    }
  }

  // Find rooms within a given time period and provide statistics
  async findRoomsInPeriod(startDate: Date, endDate: Date, scheduledRoom: boolean = false): Promise<{
    roomCount: number;
    totalPlayers: number;
    averagePlayers: number;
    averageRoomDurationInMinutes: number;
  }> {
    const rooms = await MongoRoom.find({
      createdAt: { $gte: startDate, $lte: endDate },
      scheduledRoom: scheduledRoom,
      playerIds: { $exists: true, $type: "array", $not: { $size: 1 } }
    });

    // Calculate statistics
    const roomCount = rooms.length;
    const totalPlayers = rooms.reduce((sum, room) => sum + room.playerIds.length, 0);
    const averagePlayers = roomCount ? totalPlayers / roomCount : 0;

    const maximumGameLength = 3600 * 4;//hours in seconds
    // Calculate average room duration in seconds
    const totalRoomDuration = rooms.reduce((sum, room) => {
      const endTime = room.deletedAt || new Date(); // Use deletedAt or current time if active
      let duration = (endTime.getTime() - room.createdAt.getTime()) / 1000; // Duration in seconds
      //we cap the duration as some games can be abandaned without properly deleting
      if (duration > maximumGameLength) {
        duration = maximumGameLength;
      }
      return sum + duration;
    }, 0);

    const averageRoomDurationInMinutes = roomCount ? ((totalRoomDuration / roomCount) / 60) : 0;

    return {
      roomCount,
      totalPlayers,
      averagePlayers,
      averageRoomDurationInMinutes,
    };
  }

  mapTableStreamRoomToMongoRoom(room: Room): Partial<IMongoRoom> {
    let mappedRoom: Partial<IMongoRoom> = {
      name: room.name,
      playerIds: room.players.map((player: Player) => { return player.id }),
      gameType: room.game.gameType.toString(),
      tableStreamId: room.id,
      maxPlayers: room.maxPlayers,
      scheduledRoom: room.scheduledRoom,
      initialScheduleTTLInSeconds: room.initialScheduleTTLInSeconds,
      inactivityTimeUntilDestroyedInSeconds: room.inactivityTimeUntilDestroyedInSeconds,
      reactionsEnabled: room.reactionsEnabled
    }

    return mappedRoom;
  }
}

export default new RoomService();
