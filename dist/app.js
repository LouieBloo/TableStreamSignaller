"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roomState_1 = require("./roomState");
const game_1 = require("./interfaces/game");
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
let rooms = {};
const roomState = new roomState_1.RoomState();
// Middleware to serve static files (optional)
// app.use(express.static('public'));
const getRoom = (roomName) => {
    return roomState.rooms[roomName];
};
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('joinRoom', ({ roomName, playerName }, callback) => {
        console.log("Join Room: " + " " + playerName + " - " + roomName);
        if (!rooms[roomName]) {
            rooms[roomName] = [];
            roomState.addRoom(roomName);
        }
        if (rooms[roomName].length >= 1) {
            socket.emit('roomFull');
            return;
        }
        rooms[roomName].push(socket.id);
        const newPlayer = roomState.rooms[roomName].addPlayer(playerName, socket.id);
        socket.join(roomName);
        socket.emit('roomJoined', { roomName, socketId: socket.id });
        socket.to(roomName).emit('newPeer', { socketId: socket.id, player: newPlayer, room: rooms[roomName] });
        //socket.emit('loadMessages', messages[roomName]);
        socket.on('signal', (data) => {
            io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, player: newPlayer });
        });
        socket.on('message', (message) => {
            console.log("on message: ", message);
            console.log(roomName);
            let newMessage = getRoom(roomName).addMessage(socket.id, message.text);
            if (newMessage) {
                io.in(roomName).emit('message', newMessage);
            }
        });
        socket.on('gameEvent', (event) => {
            if (event.event == game_1.GameEvent.EndCurrentTurn) {
                console.log("Ending turn: ", new Date());
                console.log("Player: ", socket.id);
            }
            try {
                event.response = getRoom(roomName).gameEvent(socket.id, event);
                io.in(roomName).emit('gameEvent', event);
            }
            catch (error) {
                socket.emit('errorResponse', { type: error.type, message: error.message });
            }
        });
        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
            rooms[roomName] = rooms[roomName].filter((id) => id !== socket.id);
            socket.to(roomName).emit('peerDisconnected', { socketId: socket.id });
            if (rooms[roomName].length === 0) {
                delete rooms[roomName];
                roomState.deleteRoom(roomName);
            }
        });
        callback(newPlayer);
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map