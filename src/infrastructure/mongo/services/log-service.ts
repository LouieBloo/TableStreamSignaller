import MongoLog, { IMongoLog } from '../models/log-model';

export const logMessage = async(log:IMongoLog):Promise<{} | IMongoLog>=>{
    if(!process.env.SAVE_LOGS || process.env.SAVE_LOGS != 'true'){
        return {};
    }

    const newLog = new MongoLog(log);
    return await newLog.save();
}