
import "reflect-metadata";
import { IMessage } from "./domain/interfaces/IMessaging";
import RoomManager from "./services/room-manager";
import { GameErrorSeverity, GameErrorType, GameEvent, IGameEvent, UserType} from "./domain/interfaces/IGame";
import { User } from "./domain/users/user";
import { Room } from "./domain/rooms/room";
import cors from 'cors';
import router from './presentation/router/router';
import userRouter from './presentation/router/user-router';
import roomRouter from './presentation/router/room-router';
import classifierTrainRouter from './presentation/router/classifier-router';
import sttRouter from './presentation/router/stt-router';
import "./infrastructure/mongo/mongo";
import { checkBearerToken } from "./presentation/router/bearer-token-check";
import { getClientIp } from "./presentation/socket/socket-service";
import { IRoomHistoryEvent, RoomEvent } from "./domain/interfaces/IRoom";
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TableStream',
      version: '1.0.0',
      description: 'API documentation for your Node.js application',
    },
  },
  apis: ['src/presentation/router/router.ts'], // Path to the API routes
};

const swaggerSpec = swaggerJSDoc(options);
const express = require('express');
const swaggerUi = require('swagger-ui-express');
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


//app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(cors());

app.use(router)

//very careful with exposing this
app.use('/classify/train', checkBearerToken, classifierTrainRouter);

app.use('/transcribe', sttRouter);
app.use('/users',userRouter);
app.use('/rooms',roomRouter);

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', async ({playerId, roomId, roomName, playerName, userType }:any, callback:any) => {
    try{
      console.log("Join Room: " + " " + playerName + " - " + roomName + " - " + roomId)

      let currentRoom:Room = await roomState.getOrCreateRoom(roomName, roomId);
  
      let newUser:User = null;
  
      if (userType == UserType.Player && currentRoom.playerSockets.length >= 4) {
        socket.emit('roomFull');
        return;
      }else if(userType == UserType.Player){
        //new player
        currentRoom.playerSockets.push(socket.id);
        newUser = currentRoom.addPlayer(playerId, playerName, socket.id)
        await currentRoom.saveAndClose();
      }else if(userType == UserType.Spectator){
        //new spectator
        currentRoom.spectatorSockets.push(socket.id);
        newUser = currentRoom.addSpectator(playerName, socket.id)
        await currentRoom.saveAndClose();
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
  
      socket.on('gameEvent', async(event:IGameEvent) => {
        let room:Room = await roomState.getRoom(currentRoom.id);
        try{
          event.response = room.gameEvent(socket.id, event)
          await room.saveAndClose();
          io.in(currentRoom.id).emit('gameEvent', event);
        }
        catch(error){
          await room.close();
          socket.emit('errorResponse', {type: error.type, message: error.message});
        }
      });
  
      socket.on('disconnect', async() => {
        console.log('A user disconnected:', socket.id);
        let room:Room = await roomState.getRoom(currentRoom.id);
        if(!room){return;}
  
        room.userDisconnected(socket.id);
        socket.to(currentRoom.id).emit('peerDisconnected', { socketId: socket.id });
        if (room.playerSockets.length === 0) {
          console.log("deleting room")
          await roomState.deleteRoom(room)
        }else{
          await room.saveAndClose();
        }
      });
  
      callback(newUser,currentRoom);
    }catch(error){
      callback(null,null,{type: error.type, message: error.message})
    }
    
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
