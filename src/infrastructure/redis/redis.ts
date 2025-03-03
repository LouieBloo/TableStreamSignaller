import Redis from 'ioredis';
import Redlock, { ResourceLockedError } from 'redlock';

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

  console.error("Redlock error:", error);
});



export { redisClient, redlock };
