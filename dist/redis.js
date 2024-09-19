"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redlock = exports.redisClient = void 0;
exports.lockRoomAndGetState = lockRoomAndGetState;
exports.saveRoomAndUnlock = saveRoomAndUnlock;
exports.deleteRoomAndUnlock = deleteRoomAndUnlock;
exports.unlockRoom = unlockRoom;
const ioredis_1 = __importDefault(require("ioredis"));
const redlock_1 = __importStar(require("redlock"));
const roomInactivityExpirationInSeconds = 7200; //2 hours
const redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST,
    port: 19210,
    password: process.env.REDIS_PASSWORD,
});
exports.redisClient = redisClient;
console.log("starting redis!!!!");
redisClient.on('error', (err) => console.error('Redis Client Error', err));
// Create a Redlock instance for distributed locking
const redlock = new redlock_1.default([redisClient], // Pass the Redis client instance
{
    retryCount: 10, // Retry up to 10 times if lock can't be acquired
    retryDelay: 200, // Wait 200ms between retries
    retryJitter: 100 // Add random jitter to avoid collisions
});
exports.redlock = redlock;
redlock.on("error", (error) => {
    // Ignore cases where a resource is explicitly marked as locked on a client.
    if (error instanceof redlock_1.ResourceLockedError) {
        return;
    }
    // Log all other errors.
    console.error(error);
});
// Function to lock a specific game room and return the game state
function lockRoomAndGetState() {
    return __awaiter(this, arguments, void 0, function* (roomId = null) {
        const lockKey = `lock:${roomId}`;
        const key = `game_room:${roomId}`;
        const ttl = 2000; // Time to live (TTL) for the lock in milliseconds (2 seconds)
        try {
            // Acquire the lock
            const lock = yield redlock.acquire([lockKey], ttl);
            //console.log(`Room ${roomName} locked successfully.`);
            // Fetch the current game state from Redis using the same key
            const room = yield redisClient.get(key);
            if (!room) {
            }
            // Parse the game state if it exists, or initialize it if not
            //const room:string = gameStateJson ? JSON.parse(gameStateJson) : null;
            // Return the lock and the game state
            return { lock, room };
        }
        catch (error) {
            console.error(`Failed to acquire lock for room ${roomId}:`, error);
            throw error;
        }
    });
}
// Function to save the updated game state to Redis
function saveRoomAndUnlock(room) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `game_room:${room.id}`; // Use the same key for saving the state
        try {
            // Save the game state back to Redis
            let lock = room.redisLock;
            delete (room.redisLock);
            yield redisClient.set(key, JSON.stringify(room), 'EX', roomInactivityExpirationInSeconds);
            //console.log(`Game state for room ${room.name} updated successfully.`);
            yield unlockRoom(lock);
        }
        catch (error) {
            console.error(`Failed to update game state for room ${room.id}:`, error);
            throw error;
        }
    });
}
function deleteRoomAndUnlock(room) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `game_room:${room.id}`; // Use the same key for saving the state
        try {
            // Save the game state back to Redis
            let lock = room.redisLock;
            yield redisClient.del(key);
            console.log(`Room ${room.id} deleted successfully.`);
            yield unlockRoom(lock);
        }
        catch (error) {
            console.error(`Failed to delete room ${room.id}:`, error);
            throw error;
        }
    });
}
// Function to unlock a specific game room
function unlockRoom(lock) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield lock.release();
            //console.log('Room unlocked successfully.');
        }
        catch (error) {
            console.error('Failed to unlock room:', error);
            throw error;
        }
    });
}
//# sourceMappingURL=redis.js.map