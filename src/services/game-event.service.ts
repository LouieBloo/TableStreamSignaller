import { IMessage } from "../domain/interfaces/messaging";
import { GameEvent, IGameEvent } from "../domain/interfaces/game";
import { RoomState } from "../domain/mtg-legacy";
import { Room } from "../domain/rooms/room";

export class GameEventService {

    constructor(){}

    public async handleGameEvent(event: IGameEvent, room: Room, io: any, roomState: RoomState, socket: any){
        try {
          event.response = room.gameEvent(socket.id, event);
          if(event.messages){
            this.handleMessages(event.messages, room, event, io)
          }

          await room.saveAndClose();
          io.in(room.id).emit('gameEvent', event);
        }
        catch (error) {
          console.error(error);
          await room.close();
          throw error;
        }
    }

    private async handleMessages(messages: IMessage[], currentRoom: Room, event: IGameEvent, io: any) {
      for (const message of messages) {
        currentRoom.addMessage(event.callingPlayer.socketId, message.text);
  
        // Special handling for coin flip event
        if (event.event === GameEvent.FlipCoins) {
          setTimeout(() => {
            io.in(currentRoom.id).emit('message', message);
          }, 2000); // delay for animation
        } else {
          io.in(currentRoom.id).emit('message', message);
        }
      }
    }
}

export default new GameEventService
