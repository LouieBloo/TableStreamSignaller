import { MongoAnalytic } from "./iMongoAnalytic";
import { RedisAnalytic } from "./iRedisAnalytic";

export interface Analytic {
    mongoAnalytics: MongoAnalytic[];
    redisAnalytic: RedisAnalytic;
}