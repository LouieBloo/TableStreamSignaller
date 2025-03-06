import { Player } from "../../domain/users/player";
import { Room } from "../../domain/rooms/room";
import MongoRoom, { IMongoRoom } from "../../infrastructure/mongo/models/room-model";

const trackingActive = process.env.MONGODB_URI ? true : false;

export const addRoom = async (room: Room): Promise<IMongoRoom> => {
  if (!trackingActive) { return null; }
  try {
    return await addRoomMongo(mapTableStreamRoomToMongoRoom(room));
  } catch (error) {
    console.error("Error adding mongo room: ", error);
  }
}

const addRoomMongo = async (roomData: Partial<IMongoRoom>): Promise<IMongoRoom> => {
  if (!trackingActive) { return null; }

  const room = new MongoRoom(roomData);
  return await room.save();
}


export const updateRoom = async (room: Room): Promise<IMongoRoom | null> => {
  if (!trackingActive) { return null; }
  try {
    return await updateRoomMongo(room.id, mapTableStreamRoomToMongoRoom(room));
  } catch (error) {
    console.error("Error updating mongo room: ", error);
  }
}


const updateRoomMongo = async (tableStreamRoomId: string, updates: Partial<IMongoRoom>): Promise<IMongoRoom | null> => {
  if (!trackingActive) { return null; }

  return await MongoRoom.findOneAndUpdate({ tableStreamId: tableStreamRoomId }, updates, { new: true });
}

export const deleteRoom = async (room: Room): Promise<IMongoRoom | null> => {
  if (!trackingActive) { return null; }
  try {
    return await MongoRoom.findOneAndUpdate(
      { tableStreamId: room.id },
      { deletedAt: new Date() }, // Set deletedAt timestamp
      { new: true }
    );
  } catch (error) {
    console.error("Error deleting mongo room: ", error);
  }
}

export const getRooms = async (startDate: Date, endDate: Date): Promise<IMongoRoom[] | null> => {
  const mongoRooms = await MongoRoom.find({
    createdAt: { $gte: startDate, $lte: endDate },
    scheduledRoom: false,
    playerIds: { $exists: true, $type: "array", $not: { $size: 1 } },
  });

  return mongoRooms;
}

const mapTableStreamRoomToMongoRoom = (room: Room): Partial<IMongoRoom> => {
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
