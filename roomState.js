module.exports = class RoomState {

    constructor() {
        this.rooms = {}
    }
 
    addRoom(roomName) {
        if(!this.rooms[roomName]){
            this.rooms[roomName] = {
                name: roomName,
                messages: [],
                players: [],
                playerOrder: {}
            }
        }
    }

    deleteRoom(roomName){
        if(this.rooms[roomName]){
            delete(this.rooms[roomName])
        }
    }

    addPlayer(playerName, socketId){
        
    }
 }