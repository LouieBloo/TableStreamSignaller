import { IRedisAnalytic } from "../../domain/interfaces/IRedisAnalytic";

export interface IRedisService {
    getCurrentRedisData(): Promise<IRedisAnalytic>
}