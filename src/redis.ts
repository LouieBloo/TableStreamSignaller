import Redis from 'ioredis';
import Redlock, { ResourceLockedError } from 'redlock';
import { Room } from './room';

const roomInactivityExpirationInSeconds = 7200;//2 hours

const redisClient = new Redis({
  host: process.env.REDIS_HOST,  
  port: 19210,          
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
  console.error(error);
});

// Function to lock a specific game room and return the game state
export async function lockRoomAndGetState(roomName: string): Promise<{ lock: any, room: string }> {
  const lockKey = `lock:${roomName}`;
  const key = `game_room:${roomName}`; 
  const ttl = 2000;  // Time to live (TTL) for the lock in milliseconds (2 seconds)

  try {
    // Acquire the lock
    const lock = await redlock.acquire([lockKey], ttl);
    //console.log(`Room ${roomName} locked successfully.`);

    // Fetch the current game state from Redis using the same key
    const room = await redisClient.get(key);

    // Parse the game state if it exists, or initialize it if not
    //const room:string = gameStateJson ? JSON.parse(gameStateJson) : null;

    // Return the lock and the game state
    return { lock, room };

  } catch (error) {
    console.error(`Failed to acquire lock for room ${roomName}:`, error);
    throw error;
  }
}

// Function to save the updated game state to Redis
export async function saveRoomAndUnlock(room: Room): Promise<void> {
  const key = `game_room:${room.name}`;  // Use the same key for saving the state
  try {
    // Save the game state back to Redis
    let lock = room.redisLock;
    delete(room.redisLock);
    await redisClient.set(key, JSON.stringify(room),'EX',roomInactivityExpirationInSeconds);
    //console.log(`Game state for room ${room.name} updated successfully.`);
    await unlockRoom(lock);
  } catch (error) {
    console.error(`Failed to update game state for room ${room.name}:`, error);
    throw error;
  }
}

export async function deleteRoomAndUnlock(room: Room): Promise<void> {
  const key = `game_room:${room.name}`;  // Use the same key for saving the state
  try {
    // Save the game state back to Redis
    let lock = room.redisLock;
    await redisClient.del(key);
    console.log(`Room ${room.name} deleted successfully.`);
    await unlockRoom(lock);
  } catch (error) {
    console.error(`Failed to delete room ${room.name}:`, error);
    throw error;
  }
}

// Function to unlock a specific game room
export async function unlockRoom(lock: any): Promise<void> {
  try {
    await lock.release();
    //console.log('Room unlocked successfully.');
  } catch (error) {
    console.error('Failed to unlock room:', error);
    throw error;
  }
}

// Export the Redis client and Redlock instance for other parts of your application
export { redisClient, redlock };
