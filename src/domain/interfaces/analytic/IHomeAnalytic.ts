import { IRedisAnalytic } from "./IRedisAnalytic";

export interface IHomeAnalytic {
  redisAnalytic: IRedisAnalytic;
  allRoomsCount: number;
}
