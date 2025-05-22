import { IAPIError } from "../../../presentation/router/interfaces/IAPIError";
import { IUser } from "../../../domain/interfaces/IPlayer";
import { IMongoUser } from "../models/user-model";
import { IProfileSettings, ITrimmedUser, IUpdateUserPayload } from "../../../presentation/router/interfaces/IUser";
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

  //profile settings
  if(updates.profileSettings){
    if(!user.profileSettings){ user.profileSettings = {};}

    if(!validProfileSettings(updates.profileSettings)){
      errors.push(apiError(`Invalid profile setting.`,'profileSetting'))
    }else{
      user.profileSettings.icon = updates.profileSettings.icon;
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
    lastNameUpdate: mongoUser.lastNameUpdate,
    profileSettings: mongoUser.profileSettings
  }
}

// reject bad usernames
export const validName = (name: string): boolean => {

  if (matcher.getAllMatches(name).length > 0) {
    return false;
  }

  return true;
}

export const validProfileSettings = (profileSetting:IProfileSettings)=>{
  if(!profileSetting){return true}
  if(profileSetting && profileSetting.icon){
    if(profileSetting.icon.color && profileSetting.icon.color.length > 12){return false;}
    if(profileSetting.icon.id && profileSetting.icon.color.length > 100){return false;}
  }

  return true;
}