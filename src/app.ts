
import "reflect-metadata";
import { IMessage } from "./interfaces/messaging";
import { RoomState } from "./roomState";
import {GameError, GameEvent, IGameEvent, UserType} from "./interfaces/game";
import { User } from "./users/user";
import { Room } from "./room";
import {isRoomPasswordProtected} from "./redis";
import axios from 'axios';
import cors from 'cors';

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

app.get('/', (req:any, res:any) => {
  res.status(200).send('Beating...');
});

app.post('/report-issue', async (req:any, res:any) => {
  const { title, body } = req.body;
  try {
    const response = await axios.post(
      'https://api.github.com/repos/louiebloo/TableStreamUI/issues',
      {
        title: title,
        body: body,
        labels:['user_submitted_issues']
      },
      {
        headers: {
          Authorization: `token ${process.env.REPORT_GITHUB_CODE}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ message: 'Issue created successfully!', data: response.data });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Failed to create issue', error: error.response.data });
  }
});

app.post('/password-check', async(req:any,res:any)=>{
  const { roomId } = req.body;

  let isPasswordPro = await isRoomPasswordProtected(roomId);

  res.status(200).json({result: isPasswordPro})
})

// const getRoom = (roomName: string)=>{
//   return roomState.rooms[roomName]
// }

io.on('connection', (socket:any) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', async ({playerId, roomId, roomName, password, gameType, playerName, userType }:any, callback:any) => {
    try{
      console.log("Join Room: " + " " + playerName + " - " + roomName + " - " + roomId)

      let currentRoom:Room = await roomState.getOrCreateRoom(roomName, roomId, password, gameType);
  
      let newUser:User = null;
  
      if (userType == UserType.Player && currentRoom.playerSockets.length >= 4) {
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
      console.log(error);
      callback(null,null,{type: error.type, message: error.message})
    }
    
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
