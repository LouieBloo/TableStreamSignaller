
import { IMessage } from "./interfaces/messaging";
import { RoomState } from "./roomState";
import {GameError, GameEvent, IGameEvent, UserType} from "./interfaces/game";
import { User } from "./users/user";

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

const getRoom = (roomName: string)=>{
  return roomState.rooms[roomName]
}

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', ({ roomName, playerName, userType }:any, callback:any) => {
    console.log("Join Room: " + " " + playerName + " - " + roomName)

    if (!roomState.rooms[roomName]) {
      roomState.addRoom(roomName)
    }

    let newUser:User = null;

    if (userType == UserType.Player && roomState.rooms[roomName].playerSockets.length >= 4) {
      socket.emit('roomFull');
      return;
    }else if(userType == UserType.Player){
      //new player
      roomState.rooms[roomName].playerSockets.push(socket.id);
      newUser = roomState.rooms[roomName].addPlayer(playerName, socket.id)
    }else if(userType == UserType.Spectator){
      //new spectator
      roomState.rooms[roomName].spectatorSockets.push(socket.id);
      newUser = roomState.rooms[roomName].addSpectator(playerName, socket.id)
    }else{
      console.error("Idk whats happening here: ", roomName, playerName, userType);
      socket.emit('error');
      return;
    }

    

    socket.join(roomName);
    //socket.emit('roomJoined', { roomName, socketId: socket.id });
    socket.to(roomName).emit('newPeer', { socketId: socket.id, user: newUser, players: roomState.rooms[roomName].playerSockets, spectators: roomState.rooms[roomName].spectatorSockets });

    socket.on('signal', (data:any) => {
      io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, user: newUser });
    }); 

    socket.on('message', (message:IMessage) => {
      console.log("on message: ", message)
      console.log(roomName)
      let newMessage = getRoom(roomName).addMessage(socket.id, message.text)
      if(newMessage){
        io.in(roomName).emit('message', newMessage);
      }
    });

    socket.on('gameEvent', (event:IGameEvent) => {
      if(event.event == GameEvent.EndCurrentTurn){
        console.log("Ending turn: ", new Date())
        console.log("Player: ", socket.id)
      }
      try{
        event.response = getRoom(roomName).gameEvent(socket.id, event)
        io.in(roomName).emit('gameEvent', event);
      }
      catch(error){
        socket.emit('errorResponse', {type: error.type, message: error.message});
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
      //rooms[roomName] = rooms[roomName].filter((id:any) => id !== socket.id);
      if(!roomState.rooms[roomName]){return;}
      roomState.rooms[roomName].userDisconnected(socket.id);
      socket.to(roomName).emit('peerDisconnected', { socketId: socket.id });
      if (roomState.rooms[roomName].playerSockets.length === 0) {
        roomState.deleteRoom(roomName)
      }
    });

    callback(newUser);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
