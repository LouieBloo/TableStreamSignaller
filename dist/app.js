"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const roomState_1 = require("./roomState");
const game_1 = require("./interfaces/game");
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
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
const roomState = new roomState_1.RoomState();
app.use(express.json());
app.use((0, cors_1.default)());
app.get('/', (req, res) => {
    res.status(200).send('Beating...');
});
app.post('/report-issue', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, body } = req.body;
    try {
        const response = yield axios_1.default.post('https://api.github.com/repos/louiebloo/TableStreamUI/issues', {
            title: title,
            body: body,
            labels: ['user_submitted_issues']
        }, {
            headers: {
                Authorization: `token ${process.env.REPORT_GITHUB_CODE}`,
                'Content-Type': 'application/json',
            },
        });
        res.status(200).json({ message: 'Issue created successfully!', data: response.data });
    }
    catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({ message: 'Failed to create issue', error: error.response.data });
    }
}));
// const getRoom = (roomName: string)=>{
//   return roomState.rooms[roomName]
// }
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('joinRoom', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ playerId, roomId, roomName, gameType, playerName, userType }, callback) {
        try {
            console.log("Join Room: " + " " + playerName + " - " + roomName + " - " + roomId);
            let currentRoom = yield roomState.getOrCreateRoom(roomName, roomId, gameType);
            let newUser = null;
            if (userType == game_1.UserType.Player && currentRoom.playerSockets.length >= 4) {
                socket.emit('roomFull');
                return;
            }
            else if (userType == game_1.UserType.Player) {
                //new player
                currentRoom.playerSockets.push(socket.id);
                newUser = currentRoom.addPlayer(playerId, playerName, socket.id);
                yield currentRoom.saveAndClose();
            }
            else if (userType == game_1.UserType.Spectator) {
                //new spectator
                currentRoom.spectatorSockets.push(socket.id);
                newUser = currentRoom.addSpectator(playerName, socket.id);
                yield currentRoom.saveAndClose();
            }
            else {
                console.error("Idk whats happening here: ", roomName, playerName, userType);
                socket.emit('error');
                return;
            }
            socket.join(currentRoom.id);
            //socket.emit('roomJoined', { roomName, socketId: socket.id });
            socket.to(currentRoom.id).emit('newPeer', { socketId: socket.id, user: newUser, players: currentRoom.playerSockets, spectators: currentRoom.spectatorSockets });
            socket.on('signal', (data) => {
                io.to(data.to).emit('signal', { from: socket.id, signal: data.signal, user: newUser });
            });
            socket.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
                let room = yield roomState.getRoom(currentRoom.id);
                let newMessage = room.addMessage(socket.id, message.text);
                if (newMessage) {
                    yield room.saveAndClose();
                    io.in(currentRoom.id).emit('message', newMessage);
                }
            }));
            socket.on('gameEvent', (event) => __awaiter(void 0, void 0, void 0, function* () {
                let room = yield roomState.getRoom(currentRoom.id);
                try {
                    event.response = room.gameEvent(socket.id, event);
                    yield room.saveAndClose();
                    io.in(currentRoom.id).emit('gameEvent', event);
                }
                catch (error) {
                    yield room.close();
                    socket.emit('errorResponse', { type: error.type, message: error.message });
                }
            }));
            socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
                console.log('A user disconnected:', socket.id);
                let room = yield roomState.getRoom(currentRoom.id);
                if (!room) {
                    return;
                }
                room.userDisconnected(socket.id);
                socket.to(currentRoom.id).emit('peerDisconnected', { socketId: socket.id });
                if (room.playerSockets.length === 0) {
                    console.log("deleting room");
                    yield roomState.deleteRoom(room);
                }
                else {
                    yield room.saveAndClose();
                }
            }));
            callback(newUser, currentRoom);
        }
        catch (error) {
            console.log(error);
            callback(null, null, { type: error.type, message: error.message });
        }
    }));
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map