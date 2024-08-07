module.exports = class Room {

    constructor(roomName) {
        this.name = roomName;
        this.messages = [];
        this.players = [];
        this.playerOrder = {};
    }
  
  
    addPlayer(playerName, socketId) {
      //check for duplicate player names
      if (this.players.find(e => e.name === playerName)) {
        return;
      }
  
      this.players.push({
        name: playerName,
        socketId: socketId
      })
    }
  
    addMessage(playerName, message){
      this.messages.push({
        playerName: playerName,
        message: message
      })
    }
  }