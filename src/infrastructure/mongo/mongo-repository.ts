import { Player } from "../../domain/users/player";
import { Room } from "../../domain/rooms/room";
import MongoRoom, { IMongoRoom } from "../../infrastructure/mongo/models/room-model";
import mongoose from "mongoose";

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

export const getRoomByTableStreamId = async (tableStreamId: string): Promise<IMongoRoom | null> => {
  const mongoRoom: IMongoRoom | null = await MongoRoom.findOne({ tableStreamId: tableStreamId });

  return mongoRoom;
}

export const getRooms = async (startDate: Date, endDate: Date): Promise<IMongoRoom[] | null> => {
  const mongoRooms = await MongoRoom.find({
    createdAt: { $gte: startDate, $lte: endDate },
    scheduledRoom: false,
    playerIds: { $exists: true, $type: "array", $not: { $size: 1 } },
  });

  return mongoRooms;
}

export const totalRoomCount = async (startDate: Date, endDate: Date): Promise<number | null> => {
  const count = await MongoRoom.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    scheduledRoom: false,
    playerIds: { $exists: true, $type: "array" },
    $expr: { $ne: [{ $size: "$playerIds" }, 1] },
  });

  return count;
}

const mapTableStreamRoomToMongoRoom = (room: Room): Partial<IMongoRoom> => {
  let mappedRoom: Partial<IMongoRoom> = {
    name: room.name,
    playerIds: room.players.map((player: Player) => player.id),
    players: room.players.map((player: Player) => {
      if(player.mongoUserId){
        return {id: player.id, userId: new mongoose.Types.ObjectId(player.mongoUserId) }
      }
      return {id: player.id}
    }),
    gameType: room.game.gameType.toString(),
    log: room.history,
    tableStreamId: room.id,
    maxPlayers: room.maxPlayers,
    scheduledRoom: room.scheduledRoom,
    initialScheduleTTLInSeconds: room.initialScheduleTTLInSeconds,
    inactivityTimeUntilDestroyedInSeconds: room.inactivityTimeUntilDestroyedInSeconds,
    reactionsEnabled: room.reactionsEnabled,
    allowPlayerKicking: room.allowPlayerKicking,
    allowSpectators: room.allowSpectators,
    bannedUserIds: room.bannedUserIds.map((userId: string) => {
      return  new mongoose.Types.ObjectId(userId)
    }),
    public: room.public
  };

  return mappedRoom;
}

export const mongoRepository = {
  addRoom,
  updateRoom,
  deleteRoom,
  getRoomByTableStreamId,
  getRooms
};
