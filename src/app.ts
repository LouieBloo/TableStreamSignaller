
import "reflect-metadata";
import { IMessage } from "./interfaces/messaging";
import { RoomState } from "./rooms/roomState";
import { GameEvent, IGameEvent, UserType} from "./interfaces/game";
import { User } from "./users/user";
import { Room } from "./rooms/room";
import cors from 'cors';
import router from './router/router'; // Path to the routes file
import "./mongo/mongo";

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

app.use(express.json());
app.use(cors());

app.use(router)

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', async ({playerId, roomId, roomName, password, gameType, playerName, userType, maxPlayers }:any, callback:any) => {
    try{
      console.log("Join Room: " + " " + playerName + " - " + roomName + " - " + roomId)

      let currentRoom:Room = await roomState.getOrCreateRoom({roomName, roomId, password, gameType, maxPlayers});
      let newUser:User = null;
  
      if (userType == UserType.Player && currentRoom.playerSockets.length >= currentRoom.maxPlayers) {
        socket.emit('roomFull');
        return;
      }else if(userType == UserType.Player){
        //new player
        try{
          newUser = currentRoom.addPlayer(playerId, playerName, socket.id, password)
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
  
      socket.on('gameEvent', async(event:IGameEvent) => {
        let room:Room = await roomState.getRoom(currentRoom.id);
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
