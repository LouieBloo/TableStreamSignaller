import {redisClient} from '../src/redis';
import moment from 'moment';
const { v4: uuidv4 } = require('uuid');

const newsKey = "globalNews"

const news = {
    expirationInSeconds: 60 * 60 * 24 * 1,
    data: {
        serverMaintenance:{
            id: uuidv4(), 

            startTime: moment('2025-01-18', 'YYYY-MM-DD').set({
                hour: 10,
                minute: 0,
                second: 0
            }).toISOString(),

            endTime: moment('2025-01-18', 'YYYY-MM-DD').set({
                hour: 11,
                minute: 30,
                second: 0
            }).toISOString()
        }
    }
}

async function wait() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
}


const run = async()=>{
    await wait();

    await redisClient.set(newsKey, JSON.stringify(news.data),'EX', news.expirationInSeconds);

    console.log(news);
}

run()