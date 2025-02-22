import { Player } from '../domain/users/player';
import { Room } from '../domain/rooms/room';
import MongoRoom, { IMongoRoom } from '../infrastructure/mongo/models/room-model';

const trackingActive = process.env.MONGODB_URI ? true : false;

class RoomService {

  async addRoom(room: Room): Promise<IMongoRoom> {
    if (!trackingActive) { return null; }
    try {
      return await this.addRoomMongo(this.mapTableStreamRoomToMongoRoom(room));
    } catch (error) {
      console.error("Error adding mongo room: ", error);
    }
  }
  
  async updateRoom(room: Room): Promise<IMongoRoom | null> {
    if (!trackingActive) { return null; }
    try {
      return await this.updateRoomMongo(room.id, this.mapTableStreamRoomToMongoRoom(room));
    } catch (error) {
      console.error("Error updating mongo room: ", error);
    }
  }


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


  private mapTableStreamRoomToMongoRoom(room: Room): Partial<IMongoRoom> {
    let mappedRoom: Partial<IMongoRoom> = {
      name: room.name,
      playerIds: room.players.map((player: Player) => player.id),
      gameType: room.game.gameType.toString(),
      tableStreamId: room.id,
      maxPlayers: room.maxPlayers,
      scheduledRoom: room.scheduledRoom,
      initialScheduleTTLInSeconds: room.initialScheduleTTLInSeconds,
      inactivityTimeUntilDestroyedInSeconds: room.inactivityTimeUntilDestroyedInSeconds,
      reactionsEnabled: room.reactionsEnabled,
      allowPlayerKicking: room.allowPlayerKicking
    };

    return mappedRoom;
  }


//should move to mongoRepository
  private async addRoomMongo(roomData: Partial<IMongoRoom>): Promise<IMongoRoom> {
    if (!trackingActive) { return null; }

    const room = new MongoRoom(roomData);
    return await room.save();
  }
  
//should move to mongoRepository
  private async updateRoomMongo(tableStreamRoomId: string, updates: Partial<IMongoRoom>): Promise<IMongoRoom | null> {
    if (!trackingActive) { return null; }

    return await MongoRoom.findOneAndUpdate({ tableStreamId: tableStreamRoomId }, updates, { new: true });
  }
}

export default new RoomService();

