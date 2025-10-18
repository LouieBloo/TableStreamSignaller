import { Server, Socket } from "socket.io";
import RoomManager from "../../services/room-manager";
import { IMessage } from "../../domain/interfaces/IMessaging";
import {
  GameErrorSeverity,
  GameErrorType,
  GameEvent,
  IGameEvent,
  UserType,
} from "../../domain/interfaces/IGame";
import { Room } from "../../domain/rooms/room";
import { User } from "../../domain/users/user";
import { getClientIp } from "./socket-service";
import { IRoomHistoryEvent, RoomEvent } from "../../domain/interfaces/IRoom";
import { JoinRoomPayload } from "../../app";

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("A user connected:", socket.id);

    const userIp: string = getClientIp(socket);

    socket.on(
      "joinRoom",
      async (joinRoomPayload: JoinRoomPayload, callback: any) => {
        try {
          logJoinRoom(joinRoomPayload);

          const currentRoom = await RoomManager.getOrCreateRoom(joinRoomPayload); //TODO check payload
          let newUser: User = null;

          if(playerTryingToJoinFullRoom(joinRoomPayload, currentRoom)) {
            socket.emit("roomFull");
            callback(null, null, { type: GameErrorType.RoomFull, message: "Room full", severity: GameErrorSeverity.Error});
            return;
          }

          if (joinRoomPayload.isPhoneCamera) {
            currentRoom.addPlayerSocket(socket.id)
          } 
          else if (joinRoomPayload.userType == UserType.Player || joinRoomPayload.userType == UserType.Spectator){
            try {
              newUser = joinRoomPayload.userType === UserType.Player
                  ? await addNewPlayer(joinRoomPayload, currentRoom, userIp, socket)//is this the right room being passed?
                  : await addNewSpectator(joinRoomPayload, currentRoom, socket);
            } catch (error) {
              throw error;
            } finally {
              await currentRoom.saveAndClose();
            }
          };    
          

          socket.join(currentRoom.id);

          broadcastNewPeerToRoom(socket, currentRoom, newUser);
          relaySignalToPeer(socket, io, newUser);
          handleMessageEvent(socket, io, currentRoom);

          socket.on("gameEvent", async (event: IGameEvent) => {
            await handleGameEvent(event, currentRoom, socket, io);
          });

          socket.on(
            "privateGameEvent",
            async (event: IGameEvent, callback: any) => {
              await handlePrivateGameEvent(
                event,
                callback,
                currentRoom,
                socket
              );
            }
          );

          socket.on("disconnect", async () => {
            await handleSocketDisconnect(socket, currentRoom, io);
          });

          callback(newUser, currentRoom);
        } catch (error) {
          console.log(error);
          callback(null, null, {
            type: error.type,
            message: error.message,
            severity: error.severity,
          });
        }
      }
    );
  });
}

function handleMessageEvent(socket: Socket, io: Server, currentRoom: Room) {
  socket.on("message", async (message: IMessage) => {
    const room: Room = await RoomManager.getRoom(currentRoom.id);
    const newMessage = room.addMessage(socket.id, message.text);
    if (newMessage) {
      await room.saveAndClose();
      io.in(currentRoom.id).emit("message", newMessage);
    }
  });
}


function relaySignalToPeer(socket: Socket, io: Server, user: User) {
  socket.on("signal", (data: any) => {
    io.to(data.to).emit("signal", {
      from: socket.id,
      signal: data.signal,
      user: user,
    });
  });
}


function broadcastNewPeerToRoom(socket: Socket, room: Room, user: User){
  socket.to(room.id).emit("newPeer", {
    socketId: socket.id,
    user: user,
    players: room.playerSockets,
    spectators: room.spectatorSockets,
  });
}

async function addNewSpectator(
  joinRoomPayload: JoinRoomPayload,
  room: Room,
  socket: any
) {
  const newUser = await room.addSpectator(
    joinRoomPayload.playerId,
    joinRoomPayload.playerName,
    socket.id,
    joinRoomPayload.password
  );
  room.addSpectatorSocket(socket.id);

  return newUser;
}

async function addNewPlayer(
  joinRoomPayload: JoinRoomPayload,
  room: Room,
  userIp: string,
  socket: any
) {
  const newUser = await room.addPlayer(joinRoomPayload, userIp, socket.id);
  room.addPlayerSocket(socket.id);

  socket.to(room.id).emit(
    "historyEvent",
    room.logRoomEvent({
      event: RoomEvent.PlayerAdded,
      value: {
        id: newUser.id,
        name: newUser.name,
      },
    })
  );
  return newUser;
}

async function handlePrivateGameEvent(
  event: IGameEvent,
  callback: any,
  currentRoom: Room,
  socket: any
) {
  let room: Room = await RoomManager.getRoom(currentRoom.id);
  try {
    event.isPrivate = true;
    event.response = room.gameEvent(socket.id, event);
    await room.saveAndClose();
    callback(event);
  } catch (error) {
    console.log(error);
    await room.close();
    socket.emit("errorResponse", {
      type: error.type,
      message: error.message,
      severity: error.severity,
    });
  }
}

async function handleGameEvent(
  event: IGameEvent,
  currentRoom: Room,
  socket: any,
  io: Server
) {
  let room: Room = await RoomManager.getRoom(currentRoom.id);
  try {
    event.response = room.gameEvent(socket.id, event);
    //if this event results in messages, add them
    if (event.messages) {
      event.messages.forEach((message: IMessage) => {
        room.addMessage(event.callingPlayer.socketId, message.text);
        //I dont like this flip coins check here but its fine for now
        if (event.event == GameEvent.FlipCoins) {
          //for coin flips we add a delay so people can watch the animation instead of looking at chat
          setTimeout(() => {
            io.in(currentRoom.id).emit("message", message);
          }, 2000);
        } else {
          io.in(currentRoom.id).emit("message", message);
        }
      });
    }

    io.in(currentRoom.id).emit("historyEvent", room.logGameEvent(event));
    await room.saveAndClose();
    io.in(currentRoom.id).emit("gameEvent", event);
  } catch (error) {
    console.log(error);
    await room.close();
    socket.emit("errorResponse", {
      type: error.type,
      message: error.message,
      severity: error.severity,
    });
  }
}

async function handleSocketDisconnect(
  socket: any,
  currentRoom: Room,
  io: Server
) {
  console.log("A user disconnected:", socket.id);
  let room: Room = await RoomManager.getRoom(currentRoom.id);
  if (!room) {
    return;
  }

  let history: IRoomHistoryEvent = room.userDisconnected(socket.id, null);
  socket.to(currentRoom.id).emit("peerDisconnected", { socketId: socket.id });
  //auto delete the room if its not a bot created room
  if (room.playerSockets.length === 0 && !room.scheduledRoom) {
    console.log("deleting room");
    await RoomManager.deleteRoom(room);
  } else {
    io.in(currentRoom.id).emit("historyEvent", history);
    await room.saveAndClose();
  }
}

function logJoinRoom(joinRoomPayload: JoinRoomPayload) {
  console.log(
    "Join Room: " +
      " " +
      joinRoomPayload.playerName +
      " - " +
      joinRoomPayload.roomName +
      " - " +
      joinRoomPayload.roomId +
      " - " +
      joinRoomPayload.playerId
  );
}

function playerTryingToJoinFullRoom(
  joinRoomPayload: JoinRoomPayload,
  room: Room
) {
  return (
    joinRoomPayload.userType == UserType.Player &&
    !room.canAddPlayer(joinRoomPayload.playerId)
  );
}
