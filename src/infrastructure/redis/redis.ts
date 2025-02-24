import Redis from 'ioredis';
import Redlock, { ResourceLockedError } from 'redlock';
import { Room } from '../../domain/rooms/room';

const redisClient = new Redis({
  host: 'localhost',  
  port: 6379,           
  password: process.env.REDIS_PASSWORD,       
});

console.log("starting redis!!!!");

redisClient.on('error', (err) => console.error('Redis Client Error', err));


// Create a Redlock instance for distributed locking
const redlock = new Redlock(
  [redisClient], // Pass the Redis client instance
  {
    retryCount: 10,        // Retry up to 10 times if lock can't be acquired
    retryDelay: 200,       // Wait 200ms between retries
    retryJitter: 100       // Add random jitter to avoid collisions
  }
);

redlock.on("error", (error) => {
  // Ignore cases where a resource is explicitly marked as locked on a client.
  if (error instanceof ResourceLockedError) {
    return;
  }

  // Log all other errors.
  console.error("Redlock error:", error);
});

// Function to lock a specific game room and return the game state
export async function lockRoomAndGetState(roomId:string = null): Promise<{ lock: any, room: string }> {
  const lockKey = `lock:${roomId}`;
  const key = `game_room:${roomId}`; 
  const ttl = 3000;  // Time to live (TTL) for the lock in milliseconds (3 seconds)

  try {
    // Acquire the lock
    const lock = await redlock.acquire([lockKey], ttl);
    //console.log(`Room ${roomName} locked successfully.`);

    // Fetch the current game state from Redis using the same key
    const room = await redisClient.get(key);

    if(!room){
      console.warn(`No existing room found for roomId=${roomId}`);
    }

    // Parse the game state if it exists, or initialize it if not
    //const room:string = gameStateJson ? JSON.parse(gameStateJson) : null;

    // Return the lock and the game state
    return { lock, room };

  } catch (error) {
    console.error(`Failed to acquire lock for room ${roomId}:`, error);
    throw error;
  }
}

// Function to get a specific game room. ONLY USE FOR READING, THIS DOES NOT LOCK THE ROOM
export async function getRoomUnsafe(roomId:string = null): Promise<{ room: string }> {
  const key = `game_room:${roomId}`; 

  try {
    // Fetch the current game state from Redis using the same key
    const room = await redisClient.get(key);

    if(!room){
      console.warn(`No existing room found for roomId=${roomId}`);
    }

    return {  room };
  } catch (error) {
    console.error(`Failed to get room ${roomId}:`, error);
    throw error;
  }
}

// Function to save the updated game state to Redis
export async function saveRoomAndUnlock(room: Room, setScheduledTTL: boolean = false): Promise<void> {
  const key = `game_room:${room.id}`;  // Use the same key for saving the state
  let lock = room.redisLock;

  try {
    // Save the game state back to Redis
    
    delete(room.redisLock);
    await redisClient.set(key, JSON.stringify(room),'EX',setScheduledTTL ? room.initialScheduleTTLInSeconds : room.inactivityTimeUntilDestroyedInSeconds);
    //console.log(`Game state for room ${room.name} updated successfully.`);
    //await unlockRoom(lock);
  } catch (error) {
    console.error(`Failed to update game state for room ${room.id}:`, error);
    throw error;
  } finally {
    // Always attempt to unlock, even if saving fails
    if (lock) {
      await unlockRoom(lock).catch((unlockErr) => {
        console.error(`Failed to unlock room ${room.id}:`, unlockErr);
      });
    }
  }
}

export async function deleteRoomAndUnlock(room: Room): Promise<void> {
  const key = `game_room:${room.id}`;  // Use the same key for saving the state
  let lock = room.redisLock;
  try {
    // Save the game state back to Redis
    await redisClient.del(key);
    console.log(`Room ${room.id} deleted successfully.`);
    // await unlockRoom(lock);
  } catch (error) {
    console.error(`Failed to delete room ${room.id}:`, error);
    throw error;
  }finally {
    // Always attempt to unlock, even if delete fails
    if (lock) {
      await unlockRoom(lock).catch((unlockErr) => {
        console.error(`Failed to unlock room on delete ${room.id}:`, unlockErr);
      });
    }
  }
}

// Function to unlock a specific game room
export async function unlockRoom(lock: any): Promise<void> {
  if (!lock) {
    // No lock to release; just return
    return;
  }
  try {
    await lock.release();
    //console.log('Room unlocked successfully.');
  } catch (error) {
    console.error('Failed to unlock room:', error);
    throw error;
  }
}

export async function isRoomPasswordProtected(roomId:string):Promise<boolean>{
  const key = `game_room:${roomId}`;
  const room = await redisClient.get(key);
  if(!room){return false}

  let parsedRoom = JSON.parse(room);
  return parsedRoom.password ? true : false;
}

export async function getAllRooms(): Promise<any[]> {
  const rooms = [];
  
  // Use SCAN to get keys matching the pattern `game_room:*`
  let cursor = '0'; // Start scanning from the beginning
  do {
    const [newCursor, keys] = await redisClient.scan(cursor, 'MATCH', 'game_room:*', 'COUNT', 100);
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
  } while (cursor !== '0');
  
  return rooms;
}


export { redisClient, redlock };
