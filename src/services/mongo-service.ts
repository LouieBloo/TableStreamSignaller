import { MongoAnalytic } from "../domain/interfaces/iMongoAnalytic";
import { Room } from "../domain/rooms/room";
import { IMongoService } from "./interfaces/iMongoService";
import { IMongoRepository } from "./interfaces/iMongoRepository";
import { IMongoRoom } from "../infrastructure/mongo/models/room-model";
import { Player } from "../domain/users/player";

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
    await this._iMongoRepository.deleteRoomAsync(room.id);
  }

  async getTwoMonthsAnalytics(): Promise<MongoAnalytic[]> {
    const twoMonthsAgo = this.getDateTwoMonthsAgo();
    const analytics = [];
  
    // Loop over each two-week period in the last two months
    for (let i = 0; i < 4; i++) {
      const { startDate, endDate } = this.getTwoWeekPeriod(twoMonthsAgo, i);
      const rooms = await this._iMongoRepository.getRoomsAsync(startDate, endDate);
  
      const analytic = this.calculateAnalyticForPeriod(rooms, startDate, endDate);
      analytics.push(analytic);
    }
  
    return analytics;
  }

  async addRoom(room: Room): Promise<IMongoRoom> {
    if (!trackingActive) { return null; }
    try {
      return await this._iMongoRepository.addRoomMongo(this.mapTableStreamRoomToMongoRoom(room));
    } catch (error) {
      console.error("Error adding mongo room: ", error);
    }
  }

    async updateRoom(room: Room): Promise<IMongoRoom | null> {
      if (!trackingActive) { return null; }
      try {
        return await this._iMongoRepository.updateRoomMongo(room.id, this.mapTableStreamRoomToMongoRoom(room));
      } catch (error) {
        console.error("Error updating mongo room: ", error);
      }
    }
  
  
  private getDateTwoMonthsAgo(): Date {
    const currentDate = new Date();
    const twoMonthsAgo = new Date(currentDate);
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    return twoMonthsAgo;
  }
  
  private getTwoWeekPeriod(twoMonthsAgo: Date, periodIndex: number): { startDate: Date; endDate: Date } {
    const startDate = new Date(twoMonthsAgo);
    startDate.setDate(startDate.getDate() + periodIndex * 14);
  
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14);
  
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

  private mapTableStreamRoomToMongoRoom(room: Room): Partial<IMongoRoom> {
    let mappedRoom: Partial<IMongoRoom> = {
      name: room.name,
      playerIds: room.players.map((player: Player) => player.id),
      gameType: room.game.gameType.toString(),
      tableStreamId: room.id,
      maxPlayers: room.maxPlayers,
      scheduledRoom: room.scheduledRoom,
      initialScheduleTTLInSeconds: room.initialScheduleTTLInSeconds,
      inactivityTimeUntilDestroyedInSeconds: room.inactivityTimeUntilDestroyedInSeconds,
      reactionsEnabled: room.reactionsEnabled,
      allowPlayerKicking: room.allowPlayerKicking
    };

    return mappedRoom;
  }
  
}
