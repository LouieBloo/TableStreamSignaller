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
import { IPhoneToken } from "../../domain/interfaces/IPhoneToken";
import { JoinRoomPayload } from "../../domain/interfaces/IJoinRoomPayload";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("A user connected:", socket.id);

    const userIp: string = getClientIp(socket);
    registerJoinRoom(socket, io, userIp);
    registerJoinRoomAsPhone(socket, io, userIp);
  });
}

function registerJoinRoomAsPhone(socket: Socket, io: Server, userIp: string) {
  socket.on(
    "joinRoomAsPhone",
    async (phoneToken: IPhoneToken, callback: any) => {
      try {
        const currentRoom = await RoomManager.getRoom(phoneToken.roomId);
        const existingPlayer = currentRoom.getPlayerByToken(
          phoneToken.playerToken
        );
        existingPlayer.updateSocketId(socket.id);
        currentRoom.addPlayerSocket(socket.id);
        await currentRoom.saveAndClose();
        socket.join(currentRoom.id);
        broadcastNewPeerToRoom(socket, currentRoom, existingPlayer, true);
        registerSignalRelay(socket, io, existingPlayer, true); //TODO should this be a new user or existing user?
        registerDisconnect(socket, io, currentRoom); //should the socket exist in redis still?
        callback(currentRoom);
      } catch {}
    }
  );
}

function registerJoinRoom(socket: Socket, io: Server, userIp: string) {
  socket.on(
    "joinRoom",
    async (joinRoomPayload: JoinRoomPayload, callback: any) => {
      try {
        const currentRoom = await RoomManager.getOrCreateRoom(joinRoomPayload);
        let newUser: User = null;

        if (playerTryingToJoinFullRoom(joinRoomPayload, currentRoom)) {
          socket.emit("roomFull");
          callback(null, null, {
            type: GameErrorType.RoomFull,
            message: "Room full",
            severity: GameErrorSeverity.Error,
          });
          return;
        }

        if (
          joinRoomPayload.userType == UserType.Player ||
          joinRoomPayload.userType == UserType.Spectator
        ) {
          try {
            newUser =
              joinRoomPayload.userType === UserType.Player
                ? await addNewPlayer(
                    joinRoomPayload,
                    currentRoom,
                    userIp,
                    socket
                  ) //is this the right room being passed?
                : await addNewSpectator(joinRoomPayload, currentRoom, socket);
          } catch (error) {
            throw error;
          } finally {
            await currentRoom.saveAndClose();
          }
        }

        socket.join(currentRoom.id);

        broadcastNewPeerToRoom(socket, currentRoom, newUser, false);
        registerSignalRelay(socket, io, newUser, false);
        registerMessageHandler(socket, io, currentRoom, newUser.id);
        registerGameEventHandler(currentRoom, socket, newUser.id, io);
        registerPrivateGameEvent(socket, currentRoom);
        registerDisconnect(socket, io, currentRoom);
        callback(newUser, currentRoom);
      } catch (error) {
        callback(null, null, {
          type: error.type,
          message: error.message,
          severity: error.severity,
        });
      }
    }
  );
}

function registerDisconnect(socket: Socket, io: Server, room: Room) {
  socket.on("disconnect", async () => {
    await handleSocketDisconnect(socket, room, io);
  });
}

function registerPrivateGameEvent(socket: Socket, room: Room) {
  socket.on("privateGameEvent", async (event: IGameEvent, callback: any) => {
    await handlePrivateGameEvent(event, callback, room, socket);
  });
}

function registerGameEventHandler(
  room: Room,
  socket: Socket,
  playerId: string,
  io: Server
) {
  socket.on("gameEvent", async (event: IGameEvent) => {
    await handleGameEvent(event, room, socket, playerId, io);
  });
}

function registerMessageHandler(
  socket: Socket,
  io: Server,
  currentRoom: Room,
  playerId: string
) {
  socket.on("message", async (message: IMessage) => {
    const room: Room = await RoomManager.getRoom(currentRoom.id);
    const newMessage = room.addMessage(socket.id, message.text, playerId);
    if (newMessage) {
      await room.saveAndClose();
      io.in(currentRoom.id).emit("message", newMessage);
    }
  });
}

function registerSignalRelay(
  socket: Socket,
  io: Server,
  user: User,
  isPhone: boolean
) {
  socket.on("signal", (data: any) => {
    io.to(data.to).emit("signal", {
      from: socket.id,
      signal: data.signal,
      user: user,
      isPhone: isPhone,
    });
  });
}

function broadcastNewPeerToRoom(
  socket: Socket,
  room: Room,
  user: User,
  isPhone: boolean
) {
  socket.to(room.id).emit("newPeer", {
    socketId: socket.id,
    user: user,
    players: room.playerSockets,
    spectators: room.spectatorSockets,
    isPhone: isPhone,
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

//TODO - when a user refreshes their screen they come in with a new socketId. This messes with the phone camera stream.
async function addNewPlayer(
  joinRoomPayload: JoinRoomPayload,
  room: Room,
  userIp: string,
  socket: Socket
) {
  const newUser = await room.addPlayer(
    joinRoomPayload,
    room.id,
    userIp,
    socket.id
  );
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
  socket: Socket,
  playerId: string,
  io: Server
) {
  let room: Room = await RoomManager.getRoom(currentRoom.id);
  try {
    event.response = room.gameEvent(socket.id, event, playerId);
    //if this event results in messages, add them
    if (event.messages) {
      event.messages.forEach((message: IMessage) => {
        room.addMessage(event.callingPlayer.socketId, message.text, playerId);
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
    await RoomManager.deleteRoom(room);
  } else {
    io.in(currentRoom.id).emit("historyEvent", history);
    await room.saveAndClose();
  }
}

function playerTryingToJoinFullRoom(joinRoomPayload: JoinRoomPayload,room: Room) {
  return ( joinRoomPayload.userType == UserType.Player && !room.canAddPlayer(joinRoomPayload.playerId));
}
