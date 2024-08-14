// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const RoomState = require('./roomState');
const roomState = new RoomState()

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

const rooms = {};


// Middleware to serve static files (optional)
// app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', ({ roomName, playerName }, callback) => {
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

    socket.on('signal', (data) => {
      io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, player: newPlayer });
    }); 

    socket.on('message', (data) => {
      console.log("on message: ", data)
      console.log(roomName)
      // const messageData = { socketId: socket .id, message };
      // messages[roomName].push(messageData);
      //roomState[roomName]
      io.in(roomName).emit('message', data);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
      rooms[roomName] = rooms[roomName].filter(id => id !== socket.id);
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
