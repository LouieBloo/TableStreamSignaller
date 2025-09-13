import { Room } from "../../../domain/rooms/room";
import RoomManager from "../../../services/room-manager";
import { updateRoom } from "../../../infrastructure/mongo/mongo-repository";
// A Map to hold the timeout IDs for each room.
// The key is the roomId (string), and the value is the timer object returned by setTimeout.
const roomTimeouts = new Map<string, NodeJS.Timeout>();


/**
 * Schedules a delayed save operation for a specific room.
 * If a save is already pending for the same room, the previous timer
 * will be cancelled and a new one will be started. This effectively
 * "debounces" the save operation.
 *
 * @param roomId The unique identifier of the room to save.
 * @param delayInMs The time to wait before saving, in milliseconds. Defaults to 10,000ms (10 seconds).
 */
export function scheduleRoomSave(roomId: string, delayInMs: number = 10000): void {
    // If a timer for this room already exists, clear it.
    if (roomTimeouts.has(roomId)) {
        clearTimeout(roomTimeouts.get(roomId)!);
    }

    // Create a new timer.
    const newTimeout = setTimeout(async() => {
        let room:Room = await RoomManager.getRoomUnsafe(roomId);

        updateRoom(room);

        // Once the save operation is initiated, remove the timeout from the map.
        roomTimeouts.delete(roomId);
    }, delayInMs);

    // Store the new timer's ID in our map.
    roomTimeouts.set(roomId, newTimeout);
}