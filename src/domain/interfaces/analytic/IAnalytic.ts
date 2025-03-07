import { IMongoAnalytic } from "./IMongoAnalytic";
import { IRedisAnalytic } from "./IRedisAnalytic";

export interface IAnalytic {
    mongoAnalytic: IMongoAnalytic;
    redisAnalytic: IRedisAnalytic;
}