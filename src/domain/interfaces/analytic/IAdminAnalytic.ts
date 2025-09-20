import { IMongoAnalytic } from "./IMongoAnalytic";
import { IRedisAnalytic } from "./IRedisAnalytic";

export interface IAdminAnalytic {
    mongoAnalytic: IMongoAnalytic;
    redisAnalytic: IRedisAnalytic;
}