import { IAPIError } from "../../../presentation/router/interfaces/IAPIError";
import { IUser } from "../../../domain/interfaces/IPlayer";
import { IMongoUser } from "../models/user-model";
import { ITrimmedUser, IUpdateUserPayload } from "../../../presentation/router/interfaces/IUser";
import { apiError } from "../../../presentation/router/services/router-error-service";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';


// profanity matcher setup
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const NAME_CHANGE_COOLDOWN_MS:number = 48 * 60 * 60 * 1000; // 48 hours

export const updateUser = async (
  user: IMongoUser,
  updates: IUpdateUserPayload
): Promise<IAPIError[]> => {
  const errors: IAPIError[] = [];

  if (updates.name !== undefined && updates.name !== user.name) {
    if (!validName(updates.name)) {
      errors.push(apiError("Inappropriate Name Detected",'name'))
    }

    if (user.lastNameUpdate) {
      const sinceLast = Date.now() - user.lastNameUpdate.getTime();
      if (sinceLast < NAME_CHANGE_COOLDOWN_MS) {
        const hoursLeft = Math.ceil((NAME_CHANGE_COOLDOWN_MS - sinceLast) / (60 * 60 * 1000));
        errors.push(apiError(`You can only change your name once every 48 hours. Please wait ${hoursLeft} more hour(s).`,'name'))
      }
    }

    if (errors.length === 0) {
      user.name = updates.name;
      user.lastNameUpdate = new Date();
    }
  }

  // SAVE IF NO ERRORS
  if (errors.length > 0) {
    return errors;
  }

  await user.save();
  return [];
};

export const trimUser = (mongoUser: IMongoUser): ITrimmedUser => {
  return {
    name: mongoUser.name,
    email: mongoUser.email,
    createdAt: mongoUser.createdAt,
    lastNameUpdate: mongoUser.lastNameUpdate
  }
}

// reject bad usernames
export const validName = (name: string): boolean => {

  if (matcher.getAllMatches(name).length > 0) {
    return false;
  }

  return true;
}