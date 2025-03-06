import { IMongoAnalytic } from "./IMongoAnalytic";
import { IRedisAnalytic } from "./IRedisAnalytic";

export interface IAnalytic {
    mongoAnalytics: IMongoAnalytic[];
    redisAnalytic: IRedisAnalytic;
}