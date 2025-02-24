import { MongoAnalytic } from "./iMongoAnalytic";
import { RedisAnalytic } from "./iRedisAnalytic";

export interface Analytic {
    mongoAnalytic: MongoAnalytic[];
    redisAnalytic: RedisAnalytic;
}