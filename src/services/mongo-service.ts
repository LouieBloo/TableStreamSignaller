import { MongoAnalytic } from "../domain/interfaces/iMongoAnalytic";
import { Room } from "../domain/rooms/room";
import { IMongoService } from "./interfaces/iMongoService";
import { IMongoRepository } from "./interfaces/iMongoRepository";
import { IMongoRoom } from "../infrastructure/mongo/models/room-model";

const trackingActive = process.env.MONGODB_URI ? true : false;

export class MongoService implements IMongoService {
  private _iMongoRepository: IMongoRepository;

  constructor(iMongoRepository: IMongoRepository) {
    this._iMongoRepository = iMongoRepository;
  }

  async deleteRoom(room: Room): Promise<IMongoRoom | null> {
    if (!trackingActive) {
      return null;
    }
    await this._iMongoRepository.deleteRoomAsync(room);
  }

  async getTwoMonthsAnalytics(): Promise<MongoAnalytic[]> {
    const twoMonthsAgo = this.getDateTwoMonthsAgo();
    const analytics = [];
  
    // Loop over each two-week period in the last two months
    for (let i = 0; i < 4; i++) {
      const { startDate, endDate } = this.getTwoWeekPeriod(twoMonthsAgo, i);
      const rooms = await this._iMongoRepository.getAnalyticAsync(startDate, endDate);
  
      const analytic = this.calculateAnalyticForPeriod(rooms, startDate, endDate);
      analytics.push(analytic);
    }
  
    return analytics;
  }
  
  private getDateTwoMonthsAgo(): Date {
    const currentDate = new Date();
    const twoMonthsAgo = new Date(currentDate);
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    return twoMonthsAgo;
  }
  
  private getTwoWeekPeriod(twoMonthsAgo: Date, periodIndex: number): { startDate: Date; endDate: Date } {
    const startDate = new Date(twoMonthsAgo);
    startDate.setDate(startDate.getDate() + periodIndex * 14); // Each period is 14 days apart
  
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // Add 14 days to the start date for the end date
  
    return { startDate, endDate };
  }
  
  private calculateAnalyticForPeriod(rooms: any[], startDate: Date, endDate: Date): MongoAnalytic {
    const roomCount = rooms.length;
    const totalPlayers = this.calculateTotalPlayers(rooms);
    const averagePlayers = roomCount ? totalPlayers / roomCount : 0;
  
    const maximumGameLength = 3600 * 4;
    const totalRoomDuration = this.calculateTotalRoomDuration(rooms, maximumGameLength);
    const averageRoomDurationInMinutes = roomCount ? totalRoomDuration / roomCount / 60 : 0;
  
    return {
      startDate,
      endDate,
      roomCount,
      totalPlayers,
      averagePlayers,
      averageRoomDurationInMinutes,
    } as MongoAnalytic
  }
  
  private calculateTotalPlayers(rooms: any[]): number {
    return rooms.reduce((sum, room) => sum + room.playerIds.length, 0);
  }
  
  private calculateTotalRoomDuration(rooms: any[], maximumGameLength: number): number {
    return rooms.reduce((sum, room) => {
      const endTime = room.deletedAt || new Date();
      let duration = (endTime.getTime() - room.createdAt.getTime()) / 1000; // Duration in seconds
      if (duration > maximumGameLength) {
        duration = maximumGameLength;
      }
      return sum + duration;
    }, 0);
  }
  
}
