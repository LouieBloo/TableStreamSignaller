import "../src/mongo/mongo";
import RoomService from '../src/mongo/services/room-service';

const run = async()=>{
    let results = await RoomService.deleteEmptyOrSinglePlayerRooms();
    console.log("Results: ");
    console.log(JSON.stringify(results));
}

run();