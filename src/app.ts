import cors from "cors";
import "reflect-metadata";
import {
  GameType,
  UserType
} from "./domain/interfaces/IGame";
import "./infrastructure/mongo/mongo";
import { checkBearerToken } from "./presentation/router/bearer-token-check";
import classifierTrainRouter from "./presentation/router/classifier-router";
import roomRouter from "./presentation/router/room-router";
import router from "./presentation/router/router";
import sttRouter from "./presentation/router/stt-router";
import userRouter from "./presentation/router/user-router";
import { registerSocketHandlers } from "./presentation/socket/socket-handler";
import fs from 'fs';
import https from 'https';

const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TableStream",
      version: "1.0.0",
      description: "API documentation for your Node.js application",
    },
  },
  apis: ["src/presentation/router/router.ts"], // Path to the API routes
};

const swaggerSpec = swaggerJSDoc(options);
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const sslOptions = {
  key: fs.readFileSync('../TableStreamUI/ssl/key.pem'),
  cert: fs.readFileSync('../TableStreamUI/ssl/cert.pem'),
};
const server = https.createServer(sslOptions, app);
// const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow requests from your client
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(cors());

app.use(router);

//very careful with exposing this
app.use("/classify/train", checkBearerToken, classifierTrainRouter);

app.use("/transcribe", sttRouter);
app.use("/users", userRouter);
app.use("/rooms", roomRouter);

export interface JoinRoomPayload {
  playerId: string;
  roomId: string;
  roomName: string;
  password: string;
  gameType: GameType;
  playerName: string;
  userType: UserType;
  maxPlayers: number;
  reactionEnabled: boolean;
  isSharingImages: boolean;
  isPublic: boolean;
  joinerJwtToken: string;
  allowSpectators: boolean;
  isPhoneCamera?: boolean;
}

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
