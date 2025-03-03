import { Lock } from "redlock/dist";
import { Room } from "../../domain/rooms/room";
import { IRedisRepository } from "../../services/interfaces/iRedisRepository";
import { redisClient, redlock } from "./redis";
import { plainToInstance } from "class-transformer";

export class RedisRepository implements IRedisRepository {
  constructor() {}

  public async saveRoomAndUnlock(
    room: Room,
    setScheduledTTL: boolean = false
  ): Promise<void> {
    const key = `game_room:${room.id}`; // Use the same key for saving the state
    let lock = room.redisLock;
    try {
      // Save the game state back to Redis

      delete room.redisLock;
      await redisClient.set(
        key,
        JSON.stringify(room),
        "EX",
        setScheduledTTL
          ? room.initialScheduleTTLInSeconds
          : room.inactivityTimeUntilDestroyedInSeconds
      );
      //console.log(`Game state for room ${room.name} updated successfully.`);
      //await unlockRoom(lock);
    } catch (error) {
      console.error(`Failed to update game state for room ${room.id}:`, error);
      throw error;
    } finally {
      // Always attempt to unlock, even if saving fails
      if (lock) {
        await this.unlockRoom(lock).catch((unlockErr) => {
          console.error(`Failed to unlock room ${room.id}:`, unlockErr);
        });
      }
    }
  }

  public async deleteRoomAndUnlock(room: Room): Promise<void> {
    const key = `game_room:${room.id}`; // Use the same key for saving the state
    let lock = room.redisLock;
    try {
      // Save the game state back to Redis
      await redisClient.del(key);
      console.log(`Room ${room.id} deleted successfully.`);
      // await unlockRoom(lock);
    } catch (error) {
      console.error(`Failed to delete room ${room.id}:`, error);
      throw error;
    } finally {
      // Always attempt to unlock, even if delete fails
      if (lock) {
        await this.unlockRoom(lock).catch((unlockErr) => {
          console.error(
            `Failed to unlock room on delete ${room.id}:`,
            unlockErr
          );
        });
      }
    }
  }

  public async unlockRoom(lock: Lock): Promise<void> {
    if (!lock) {
      return;
    }
    try {
      await lock.release();
      //console.log('Room unlocked successfully.');
    } catch (error) {
      console.error("Failed to unlock room:", error);
      throw error;
    }
  }

  public async isRoomPasswordProtected(roomId: string): Promise<boolean> {
    const key = `game_room:${roomId}`;
    const room = await redisClient.get(key);
    if (!room) {
      return false;
    }

    const parsedRoom = JSON.parse(room);
    return parsedRoom.password ? true : false;
  }

  //TODO type all this
  public async getAllRooms(): Promise<any[]> {
    const rooms = [];

    // Use SCAN to get keys matching the pattern `game_room:*`
    let cursor = "0"; // Start scanning from the beginning
    do {
      const [newCursor, keys] = await redisClient.scan(
        cursor,
        "MATCH",
        "game_room:*",
        "COUNT",
        100
      );
      cursor = newCursor; // Update cursor for next iteration
      for (const key of keys) {
        const roomData = await redisClient.get(key);
        if (roomData) {
          try {
            // Parse the room data as JSON
            const roomJson = JSON.parse(roomData);
            rooms.push(roomJson);
          } catch (error) {
            console.error(`Failed to parse room data for key ${key}:`, error);
          }
        }
      }
    } while (cursor !== "0");

    return rooms;
  }

  public async lockRoomAndGetState(roomId: string = null): Promise<Room> {
    const lockKey = `lock:${roomId}`;
    const key = `game_room:${roomId}`;
    const ttl = 3000; // Time to live (TTL) for the lock in milliseconds (3 seconds)
    console.log("roomId: " + roomId)
    try {
      const lock = await redlock.acquire([lockKey], ttl);
      const room = await redisClient.get(key);

      if (!room) {
        console.warn(`No existing room found for roomId=${roomId}`);
        return null;
      }

      let parsedRoom = this.parseRoom(room);
      parsedRoom.redisLock = lock;

      return parsedRoom;
    } catch (error) {
      console.error(`Failed to acquire lock for room ${roomId}:`, error);
      throw error;
    }
  }

  public async getRoomUnsafe(roomId: string = null): Promise<Room|null> {
    const key = `game_room:${roomId}`;

    try {
      const room = await redisClient.get(key);

      if (!room) {
        console.warn(`No existing room found for roomId=${roomId}`);
        return null
      }

      return this.parseRoom(room);

    } catch (error) {
      console.error(`Failed to get room ${roomId}:`, error);
      throw error;
    }
  }


  private parseRoom(roomString: string): Room {
    const rawJSON = JSON.parse(roomString);
    
    const game = Room.createGame(rawJSON.game.gameType);
    Object.assign(game, rawJSON.game);
    
    const room: Room = plainToInstance(Room, rawJSON);
    room.game = game;
    
    return room;
  }


}
