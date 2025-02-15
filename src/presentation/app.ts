
import "reflect-metadata";
import { IMessage } from "../domain/interfaces/messaging";
import { GameErrorSeverity, GameErrorType, IGameEvent, UserType} from "../domain/interfaces/game";
import { User } from "../domain/users/user";
import { Room } from "../domain/rooms/room";
import cors from 'cors';
import router from './router/router'; // Path to the routes file
import classifierTrainRouter from './router/classifier-router';
import sttRouter from './router/stt-router';
import "../mongo/mongo";
import { checkBearerToken } from "./router/bearer-token-check";
import { getClientIp } from "./socket/socket-service";
import { GameEventService } from "../services/game-event.service";
import { RoomState } from "../domain/mtg-legacy";

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow requests from your client
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const roomState = new RoomState()
const gameEventService = new GameEventService()

app.use(express.json());
app.use(cors());

app.use(router)

//very careful with exposing this
app.use('/classify/train', checkBearerToken, classifierTrainRouter);

app.use('/transcribe', sttRouter);

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  const userIp:string = getClientIp(socket);

  socket.on('joinRoom', async ({playerId, roomId, roomName, password, gameType, playerName, userType, maxPlayers, reactionsEnabled, isSharingImages }:any, callback:any) => {
    try{
      console.log("Join Room: " + " " + playerName + " - " + roomName + " - " + roomId + " - " + playerId)

      let currentRoom:Room = await roomState.getOrCreateRoom({roomName, roomId, password, gameType, maxPlayers, reactionsEnabled: reactionsEnabled});
      let newUser:User = null;
  
      if (userType == UserType.Player && !currentRoom.canAddPlayer(playerId,socket.id)) {
        socket.emit('roomFull');
        callback(null,null,{type: GameErrorType.RoomFull, message: "Room full", severity: GameErrorSeverity.Error})
        return;
      }else if(userType == UserType.Player){
        //new player
        try{
          newUser = currentRoom.addPlayer(playerId, playerName, socket.id, password, userIp, isSharingImages)
          currentRoom.playerSockets.push(socket.id);
        }catch(error){
          throw error;
        }finally{
          await currentRoom.saveAndClose();
        }
      }else if(userType == UserType.Spectator){
        //new spectator
        try{
          newUser = currentRoom.addSpectator(playerId, playerName, socket.id, password)
          currentRoom.spectatorSockets.push(socket.id);
        }catch(error){
          throw error;
        }finally{
          await currentRoom.saveAndClose();
        }
      }else{
        console.error("Idk whats happening here: ", roomName, playerName, userType);
        socket.emit('error');
        return;
      }
  
      socket.join(currentRoom.id);
      //socket.emit('roomJoined', { roomName, socketId: socket.id });
      socket.to(currentRoom.id).emit('newPeer', { socketId: socket.id, user: newUser, players: currentRoom.playerSockets, spectators: currentRoom.spectatorSockets });
  
      socket.on('signal', (data:any) => {
        io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, user: newUser });
      }); 
  
      socket.on('message', async(message:IMessage) => {
        let room:Room = await roomState.getRoom(currentRoom.id);
        let newMessage = room.addMessage(socket.id, message.text)
        if(newMessage){
          await room.saveAndClose();
          io.in(currentRoom.id).emit('message', newMessage);
        }
      });
  
      //primary game events
      socket.on('gameEvent', async(event:IGameEvent) => {
        let room = await roomState.getRoom(currentRoom.id); // Get the current room from the state

        if (!currentRoom) {
          socket.emit('errorResponse', { message: 'Room not found' });
          return;
        }

        try {
          await gameEventService.handleGameEvent(event, room, io, roomState, socket);
        } catch(error){
          console.log(error)
          await room.close();
          socket.emit('errorResponse', {type: error.type, message: error.message, severity: error.severity});
        }
      });

      //private game events such as personal settings
      socket.on('privateGameEvent', async(event: IGameEvent, callback:any) => {
        let room:Room = await roomState.getRoom(currentRoom.id);
        try{
          event.isPrivate = true;
          event.response = room.gameEvent(socket.id, event)
          await room.saveAndClose();
          callback(event);
        }
        catch(error){
          console.log(error)
          await room.close();
          socket.emit('errorResponse', {type: error.type, message: error.message, severity: error.severity});
        }
      });
  
      socket.on('disconnect', async() => {
        console.log('A user disconnected:', socket.id);
        let room:Room = await roomState.getRoom(currentRoom.id);
        if(!room){return;}
  
        room.userDisconnected(socket.id);
        socket.to(currentRoom.id).emit('peerDisconnected', { socketId: socket.id });
        //auto delete the room if its not a bot created room 
        if (room.playerSockets.length === 0 && !room.scheduledRoom) {
          console.log("deleting room")
          await roomState.deleteRoom(room)
        }else{
          await room.saveAndClose();
        }
      });
  
      callback(newUser,currentRoom);
    }catch(error){
      console.log(error);
      callback(null,null,{type: error.type, message: error.message, severity: error.severity})
    }
    
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
