import "../src/mongo/mongo";
import RoomService from '../src/mongo/services/room-service';

const run = async(daysAgo:number)=>{
    let startTime = new Date();
    startTime.setDate(startTime.getDate() - daysAgo);

    let endTime = new Date();

    let results = await RoomService.findRoomsInPeriod(startTime, endTime);
    console.log("Results: ");
    console.log(JSON.stringify(results));
}

run(14);