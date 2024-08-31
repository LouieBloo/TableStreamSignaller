
import { IMessage } from "./interfaces/messaging";
import { RoomState } from "./roomState";
import {GameError, GameEvent, IGameEvent} from "./interfaces/game";

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

let rooms: { [key: string | number | symbol]: any } = {};

const roomState = new RoomState()

// Middleware to serve static files (optional)
// app.use(express.static('public'));

const getRoom = (roomName: string)=>{
  return roomState.rooms[roomName]
}

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', ({ roomName, playerName }:any, callback:any) => {
    console.log("Join Room: " + " " + playerName + " - " + roomName)

    if (!rooms[roomName]) {
      rooms[roomName] = [];
      roomState.addRoom(roomName)
    }

    if (rooms[roomName].length >= 4) {
      socket.emit('roomFull');
      return;
    }

    rooms[roomName].push(socket.id);

    const newPlayer = roomState.rooms[roomName].addPlayer(playerName, socket.id)

    socket.join(roomName);
    socket.emit('roomJoined', { roomName, socketId: socket.id });
    socket.to(roomName).emit('newPeer', { socketId: socket.id, player: newPlayer, room: rooms[roomName] });

    //socket.emit('loadMessages', messages[roomName]);

    socket.on('signal', (data:any) => {
      io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, player: newPlayer });
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
      rooms[roomName] = rooms[roomName].filter((id:any) => id !== socket.id);
      socket.to(roomName).emit('peerDisconnected', { socketId: socket.id });
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
        roomState.deleteRoom(roomName)
      }
    });

    callback(newPlayer)
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
