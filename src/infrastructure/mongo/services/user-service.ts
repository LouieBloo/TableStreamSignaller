import { IUser } from "../../../domain/interfaces/IPlayer";
import { IMongoUser } from "../models/user-model";

export const trimUser = (mongoUser: IMongoUser): IUser => {
  return {
    name: mongoUser.name,
    email: mongoUser.email,
    id: null,
  }
}