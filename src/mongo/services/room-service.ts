import { Player } from '../../users/player';
import { Room } from '../../rooms/room';
import MongoRoom, { IMongoRoom } from '../models/room-model';

const trackingActive = process.env.MONGODB_URI ? true : false;

class RoomService {

  // helper so callers dont need to do any mapping
  async addRoom(room: Room): Promise<IMongoRoom> {
    if (!trackingActive) { return null; }
    try{
      return await this.addRoomMongo(this.mapTableStreamRoomToMongoRoom(room))
    }catch(error){
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

    return await this.updateRoomMongo(room.id, this.mapTableStreamRoomToMongoRoom(room))
  }

  // actually update the room
  async updateRoomMongo(tableStreamRoomId: string, updates: Partial<IMongoRoom>): Promise<IMongoRoom | null> {
    if (!trackingActive) { return null; }

    return await MongoRoom.findOneAndUpdate({ tableStreamId: tableStreamRoomId }, updates, { new: true });
  }

  // Delete a room
  async deleteRoom(room:Room): Promise<IMongoRoom | null> {
    if (!trackingActive) { return null; }

    return await MongoRoom.findOneAndUpdate(
      { tableStreamId: room.id },
      { deletedAt: new Date() }, // Set deletedAt timestamp
      { new: true }
    );
  }

  // Find rooms within a given time period and provide statistics
  async findRoomsInPeriod(startDate: Date, endDate: Date, scheduledRoom:boolean = false): Promise<{
    roomCount: number;
    totalPlayers: number;
    averagePlayers: number;
    averageRoomDurationInMinutes: number;
  }> {
    const rooms = await MongoRoom.find({
      createdAt: { $gte: startDate, $lte: endDate },
      scheduledRoom: scheduledRoom
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
      if(duration > maximumGameLength){
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
      inactivityTimeUntilDestroyedInSeconds: room.inactivityTimeUntilDestroyedInSeconds
    }

    return mappedRoom;
  }
}

export default new RoomService();
