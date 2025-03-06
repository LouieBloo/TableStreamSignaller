import { IMongoAnalytic } from "../domain/interfaces/IMongoAnalytic";
import { getRooms } from "../infrastructure/mongo/mongo-repository";

export const getTwoMonthsAnalytics = async (): Promise<IMongoAnalytic[]> => {
  const twoMonthsAgo = getDateTwoMonthsAgo();
  const analytics = [];

  // Loop over each two-week period in the last two months
  for (let i = 0; i < 4; i++) {
    const { startDate, endDate } = getTwoWeekPeriod(twoMonthsAgo, i);
    const rooms = await getRooms(startDate, endDate);

    const analytic = calculateAnalyticForPeriod(rooms, startDate, endDate);
    analytics.push(analytic);
  }

  return analytics;
}

const getDateTwoMonthsAgo = (): Date => {
  const currentDate = new Date();
  const twoMonthsAgo = new Date(currentDate);
  twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
  return twoMonthsAgo;
}

const getTwoWeekPeriod = (twoMonthsAgo: Date, periodIndex: number): { startDate: Date; endDate: Date } => {
  const startDate = new Date(twoMonthsAgo);
  startDate.setDate(startDate.getDate() + periodIndex * 14); // Each period is 14 days apart

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14); // Add 14 days to the start date for the end date

  return { startDate, endDate };
}

const calculateAnalyticForPeriod = (rooms: any[], startDate: Date, endDate: Date): IMongoAnalytic => {
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
  } as IMongoAnalytic
}

const calculateTotalPlayers = (rooms: any[]): number => {
  return rooms.reduce((sum, room) => sum + room.playerIds.length, 0);
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