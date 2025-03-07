import { IGameAnalytic } from "./IGameAnalytic";
import { IMongoAnalyticByDate } from "./IMongoAnalyticByDate";

export interface IMongoAnalytic {
    totalPlayersToday: number;
    totalRoomsToday: number;
    gameAnalytics: IGameAnalytic[],
    mongoAnalyticsByDate: IMongoAnalyticByDate[];
}

