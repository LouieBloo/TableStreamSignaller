import { IMongoRoom } from "../infrastructure/mongo/models/room-model";
import { IMongoAnalyticByDate } from "../domain/interfaces/analytic/IMongoAnalyticByDate";
import { IRedisAnalytic } from "../domain/interfaces/analytic/IRedisAnalytic";
import { getAllRooms } from "../infrastructure/redis/redis";
import { IAdminAnalytic } from "../domain/interfaces/analytic/IAdminAnalytic";
import { IMongoAnalytic } from "../domain/interfaces/analytic/IMongoAnalytic";
import { IGameAnalytic } from "../domain/interfaces/analytic/IGameAnalytic";
import { IHomeAnalytic } from "../domain/interfaces/analytic/IHomeAnalytic";
import { getRooms as getMongoRooms, totalRoomCount } from "../infrastructure/mongo/mongo-repository";
import mongoose from "mongoose";


export const getHomeAnalytic = async (): Promise<IHomeAnalytic> => {
  const redisAnalytic = await getRedisAnalytic();
  const allRoomsCount = await getAllRoomsCount();
  return {
    redisAnalytic,
    allRoomsCount
  } as IHomeAnalytic
} 

export const getAdminAnalytic = async (): Promise<IAdminAnalytic> => {
  const mongoAnalytic = await getMongoAnalytic();
  const redisAnalytic = await getRedisAnalytic();

  return {
    mongoAnalytic: mongoAnalytic,
    redisAnalytic: redisAnalytic
  } as IAdminAnalytic
}

const getMongoAnalytic = async (): Promise<IMongoAnalytic|null> => {
  if (!isMongoConnected()) return null;

  const fourMonthsAgo = getDateFourMonthsAgo();
  const mongoAnalytics = [];
  let allRooms: IMongoRoom[] = [];

  // Loop over each month of the last 4 months
  for (let i = 0; i < 4; i++) {
    const { startDate, endDate } = getOneMonthPeriod(fourMonthsAgo, i);
    const rooms = await getMongoRooms(startDate, endDate);
    const analytic = calculateAnalyticForPeriod(rooms, startDate, endDate);
    mongoAnalytics.push(analytic);
    allRooms = allRooms.concat(rooms);
  }
  const todaysRooms = getTodaysRooms(allRooms);
  const gameAnalytics = getGameAnalytics(allRooms);
  const totalPlayersToday = calculateTotalPlayersToday(todaysRooms)

  const mongoAnalytic: IMongoAnalytic = {
    totalPlayersToday: totalPlayersToday,
    totalRoomsToday: todaysRooms.length,
    mongoAnalyticsByDate: mongoAnalytics,
    gameAnalytics: gameAnalytics
  }

  return mongoAnalytic;
}

const getGameAnalytics = (rooms: IMongoRoom[]) => {
  const gameAnalytics: IGameAnalytic[] = [];
  const roomMap: Map<string, IMongoRoom[]> = new Map();
  rooms.forEach(room => {
    const gameType = room.gameType;

    if (!roomMap.has(gameType)) {
      roomMap.set(gameType, []);
    }
    
    roomMap.get(gameType)?.push(room);
  });

  roomMap.forEach((roomsForGameType, gameType) => {
    const numberOfRooms = roomsForGameType.length;
    gameAnalytics.push({
      gameType,
      numberOfRooms,
    });
  });


  return gameAnalytics
}

const getRedisAnalytic = async(): Promise<IRedisAnalytic> => {
  const allRooms = await getAllRooms();
  
  const redisAnalytic: IRedisAnalytic = {
    activePlayers: getActivePlayersFromRedis(allRooms),
    activeRooms: allRooms.length
  }

  return redisAnalytic;
}

const getActivePlayersFromRedis = (rooms: any[]) => {
  let totalActivePlayers = 0;
  for (const room of rooms) {
    totalActivePlayers += room.players.length || 0;
  }
  return totalActivePlayers
}

const calculateAnalyticForPeriod = (rooms: IMongoRoom[], startDate: Date, endDate: Date): IMongoAnalyticByDate => {
  const roomCount = rooms.length;
  const totalPlayers = calculateTotalPlayers(rooms);
  const averagePlayers = roomCount ? totalPlayers / roomCount : 0;

  const maximumGameLength = 3600 * 4;
  const totalRoomDuration = calculateTotalRoomDuration(rooms, maximumGameLength);
  const averageRoomDurationInMinutes = roomCount ? totalRoomDuration / roomCount / 60 : 0;

  return {
    startDate,
    endDate,
    roomCount,
    totalPlayers,
    averagePlayers,
    averageRoomDurationInMinutes,
  } as IMongoAnalyticByDate
}

const getTodaysRooms = (rooms: IMongoRoom[]): IMongoRoom[] => {
  const today = new Date().setHours(0, 0, 0, 0);
  const tomorrow = today + 86400000; // Start of tomorrow

  return rooms.filter(room => {
    const roomCreatedDate = room.createdAt.getTime();
    return roomCreatedDate >= today && roomCreatedDate < tomorrow;
  });
}

const getDateFourMonthsAgo = (): Date => {
  const currentDate = new Date();
  const fourMonthsAgo = new Date(currentDate);
  fourMonthsAgo.setMonth(currentDate.getMonth() - 4);
  return fourMonthsAgo;
}

const getOneMonthPeriod = (fourMonthsAgo: Date, periodIndex: number): { startDate: Date; endDate: Date } => {
  const startDate = new Date(fourMonthsAgo);
  startDate.setDate(startDate.getDate() + periodIndex * 30); // Each period is 30 days apart

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // Add 30 days to the start date for the end date

  return { startDate, endDate };
}

const calculateTotalPlayersToday = (rooms: IMongoRoom[]): number => {
  return rooms.reduce((total, room) => total + (room.playerIds?.length || 0), 0);
}

const calculateTotalPlayers = (rooms: any[]): number => {
  return rooms.reduce((sum, room) => sum + room.playerIds.length, 0);
}

const getAllRoomsCount = async(): Promise<number|null> => {
if (!isMongoConnected()) return null;

  const beginningOfTime = new Date(0);
  const now = new Date();
  const roomCount = await totalRoomCount(beginningOfTime, now);
  return roomCount;
}

const calculateTotalRoomDuration = (rooms: any[], maximumGameLength: number): number => {
  return rooms.reduce((sum, room) => {
    const endTime = room.deletedAt || new Date();
    let duration = (endTime.getTime() - room.createdAt.getTime()) / 1000; // Duration in seconds
    if (duration > maximumGameLength) {
      duration = maximumGameLength;
    }
    return sum + duration;
  }, 0);
}

const isMongoConnected = (): boolean => mongoose.connection.readyState === 1;
