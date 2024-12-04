import { GameType } from "../interfaces/game";
import { Room } from "../rooms/room";
import { createRoom } from "../rooms/room-controller";
import { ICreateRoomParams } from "../rooms/roomState";


const handler = async(req: any, res: any) => {
  console.log(JSON.stringify(req.body))
  // Parse the interaction
  const data = req.body.data;

  // Handle application commands
  if (data.name =='create_game') {
    try{

      let roomParams:ICreateRoomParams = {
        roomName: "",
        gameType: GameType.Game,
        initialScheduleTTLInSeconds: 60 * 15, //15 mins
        scheduledRoom: true
      };

      //map discords options array into our params
      req.body.data.options.forEach((option:any)=>{
        if(option.name == "room_name"){
          roomParams.roomName = option.value;
        }
        if(option.name == "game_type"){
          roomParams.gameType = Room.gameTypeMapping(option.value);
        }
        if(option.name == "max_players"){
          roomParams.maxPlayers = option.value;
        }
        if(option.name == "password"){
          roomParams.password = option.value;
        }
        if(option.name == "reactions_enabled"){
          roomParams.reactionsEnabled = option.value;
        }
      })

      let newRoom = await createRoom(roomParams);
  
      // Respond to Discord
      return res.json({
        type: 4, // Channel message with source
        data: {
          content: `Room "${newRoom.roomName}" has been created at ${newRoom.roomUrl} ! The room will auto expire in 15 minutes if nobody joins.`,
        },
      });
    }catch(error){
      console.error("Error creating discord game: ", error)
      return res.json({
        type: 4,
        data: {
          content: JSON.stringify(error),
        },
      });
    }
    
  }else {
    // Handle unknown commands
    return res.json({
      type: 4,
      data: {
        content: 'Unknown command',
      },
    });
  }
};

export default handler;
