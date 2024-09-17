
import "reflect-metadata";
import { IMessage } from "./interfaces/messaging";
import { RoomState } from "./roomState";
import {GameError, GameEvent, IGameEvent, UserType} from "./interfaces/game";
import { User } from "./users/user";
import { Room } from "./room";

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

//let rooms: { [key: string | number | symbol]: any } = {};

const roomState = new RoomState()

// Middleware to serve static files (optional)
// app.use(express.static('public'));

// const getRoom = (roomName: string)=>{
//   return roomState.rooms[roomName]
// }

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', async ({playerId, roomName, playerName, userType }:any, callback:any) => {
    console.log("Join Room: " + " " + playerName + " - " + roomName)

    let currentRoom:Room = await roomState.getOrCreateRoom(roomName);

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

    

    socket.join(roomName);
    //socket.emit('roomJoined', { roomName, socketId: socket.id });
    socket.to(roomName).emit('newPeer', { socketId: socket.id, user: newUser, players: currentRoom.playerSockets, spectators: currentRoom.spectatorSockets });

    socket.on('signal', (data:any) => {
      io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, user: newUser });
    }); 

    socket.on('message', async(message:IMessage) => {
      let room:Room = await roomState.getRoom(roomName);
      let newMessage = room.addMessage(socket.id, message.text)
      if(newMessage){
        await room.saveAndClose();
        io.in(roomName).emit('message', newMessage);
      }
    });

    socket.on('gameEvent', async(event:IGameEvent) => {
      let room:Room = await roomState.getRoom(roomName);
      try{
        event.response = room.gameEvent(socket.id, event)
        await room.saveAndClose();
        io.in(roomName).emit('gameEvent', event);
      }
      catch(error){
        await room.close();
        socket.emit('errorResponse', {type: error.type, message: error.message});
      }
    });

    socket.on('disconnect', async() => {
      console.log('A user disconnected:', socket.id);
      let room:Room = await roomState.getRoom(roomName);
      if(!room){return;}

      room.userDisconnected(socket.id);
      socket.to(roomName).emit('peerDisconnected', { socketId: socket.id });
      if (room.playerSockets.length === 0) {
        console.log("deleting room")
        await roomState.deleteRoom(room)
      }else{
        await room.saveAndClose();
      }
    });

    callback(newUser,currentRoom);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
