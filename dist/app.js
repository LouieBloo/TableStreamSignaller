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
//let rooms: { [key: string | number | symbol]: any } = {};
const roomState = new roomState_1.RoomState();
// Middleware to serve static files (optional)
// app.use(express.static('public'));
const getRoom = (roomName) => {
    return roomState.rooms[roomName];
};
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('joinRoom', ({ roomName, playerName, userType }, callback) => {
        console.log("Join Room: " + " " + playerName + " - " + roomName);
        if (!roomState.rooms[roomName]) {
            roomState.addRoom(roomName);
        }
        let newUser = null;
        if (userType == game_1.UserType.Player && roomState.rooms[roomName].playerSockets.length >= 4) {
            socket.emit('roomFull');
            return;
        }
        else if (userType == game_1.UserType.Player) {
            //new player
            roomState.rooms[roomName].playerSockets.push(socket.id);
            newUser = roomState.rooms[roomName].addPlayer(playerName, socket.id);
        }
        else if (userType == game_1.UserType.Spectator) {
            //new spectator
            roomState.rooms[roomName].spectatorSockets.push(socket.id);
            newUser = roomState.rooms[roomName].addSpectator(playerName, socket.id);
        }
        else {
            console.error("Idk whats happening here: ", roomName, playerName, userType);
            socket.emit('error');
            return;
        }
        socket.join(roomName);
        //socket.emit('roomJoined', { roomName, socketId: socket.id });
        socket.to(roomName).emit('newPeer', { socketId: socket.id, user: newUser, players: roomState.rooms[roomName].playerSockets, spectators: roomState.rooms[roomName].spectatorSockets });
        socket.on('signal', (data) => {
            io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, user: newUser });
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
            //rooms[roomName] = rooms[roomName].filter((id:any) => id !== socket.id);
            if (!roomState.rooms[roomName]) {
                return;
            }
            roomState.rooms[roomName].userDisconnected(socket.id);
            socket.to(roomName).emit('peerDisconnected', { socketId: socket.id });
            if (roomState.rooms[roomName].playerSockets.length === 0) {
                console.log("deleting room");
                roomState.deleteRoom(roomName);
            }
        });
        callback(newUser);
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map