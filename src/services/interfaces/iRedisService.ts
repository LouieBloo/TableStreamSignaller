import { RedisAnalytic } from "../../domain/interfaces/iRedisAnalytic";

export interface IRedisService {
    getCurrentRedisData(): Promise<RedisAnalytic>
}