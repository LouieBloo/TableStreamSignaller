
import "reflect-metadata";
import { IMessage } from "./domain/interfaces/IMessaging";
import RoomManager from "./services/room-manager";
import { GameErrorSeverity, GameErrorType, GameEvent, IGameEvent, UserType} from "./domain/interfaces/IGame";
import { User } from "./domain/users/user";
import { Room } from "./domain/rooms/room";
import cors from 'cors';
import router from './presentation/router/router';
import userRouter from './presentation/router/auth';
import classifierTrainRouter from './presentation/router/classifier-router';
import sttRouter from './presentation/router/stt-router';
import "./infrastructure/mongo/mongo";
import { checkBearerToken } from "./presentation/router/bearer-token-check";
import { getClientIp } from "./presentation/socket/socket-service";
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

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  const userIp:string = getClientIp(socket);

  socket.on('joinRoom', async ({playerId, roomId, roomName, password, gameType, playerName, userType, maxPlayers, reactionsEnabled, isSharingImages }:any, callback:any) => {
    try{
      console.log("Join Room: " + " " + playerName + " - " + roomName + " - " + roomId + " - " + playerId)

      console.log("password ", password)

      let currentRoom:Room = await RoomManager.getOrCreateRoom({roomName, roomId, password, gameType, maxPlayers, reactionsEnabled: reactionsEnabled});
      let newUser:User = null;
  
      if (userType == UserType.Player && !currentRoom.canAddPlayer(playerId,socket.id)) {
        socket.emit('roomFull');
        callback(null,null,{type: GameErrorType.RoomFull, message: "Room full", severity: GameErrorSeverity.Error})
        return;
      }else if(userType == UserType.Player){
        //new player
        try{
          newUser = await currentRoom.addPlayer(playerId, playerName, socket.id, password, userIp, isSharingImages)
          currentRoom.playerSockets.push(socket.id);
        }catch(error){
          throw error;
        }finally{
          await currentRoom.saveAndClose();
        }
      }else if(userType == UserType.Spectator){
        //new spectator
        try{
          newUser = await currentRoom.addSpectator(playerId, playerName, socket.id, password)
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
        let room:Room = await RoomManager.getRoom(currentRoom.id);
        let newMessage = room.addMessage(socket.id, message.text)
        if(newMessage){
          await room.saveAndClose();
          io.in(currentRoom.id).emit('message', newMessage);
        }
      });
  
      //primary game events
      socket.on('gameEvent', async(event:IGameEvent) => {
        let room:Room = await RoomManager.getRoom(currentRoom.id);
        try{
          event.response = room.gameEvent(socket.id, event)
          //if this event results in messages, add them
          if(event.messages){
            event.messages.forEach((message:IMessage)=>{
              room.addMessage(event.callingPlayer.socketId, message.text)
              //I dont like this flip coins check here but its fine for now
              if(event.event == GameEvent.FlipCoins){
                //for coin flips we add a delay so people can watch the animation instead of looking at chat
                setTimeout(()=>{
                  io.in(currentRoom.id).emit('message', message);
                },2000)
              }else{
                io.in(currentRoom.id).emit('message', message);
              }
            })
          }

          await room.saveAndClose();
          io.in(currentRoom.id).emit('gameEvent', event);
        }
        catch(error){
          console.log(error)
          await room.close();
          socket.emit('errorResponse', {type: error.type, message: error.message, severity: error.severity});
        }
      });

      //private game events such as personal settings
      socket.on('privateGameEvent', async(event: IGameEvent, callback:any) => {
        let room:Room = await RoomManager.getRoom(currentRoom.id);
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
        let room:Room = await RoomManager.getRoom(currentRoom.id);
        if(!room){return;}
  
        room.userDisconnected(socket.id, null);
        socket.to(currentRoom.id).emit('peerDisconnected', { socketId: socket.id });
        //auto delete the room if its not a bot created room 
        if (room.playerSockets.length === 0 && !room.scheduledRoom) {
          console.log("deleting room")
          await RoomManager.deleteRoom(room);
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
