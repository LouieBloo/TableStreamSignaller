const Player = require("./player");

module.exports = class Room {

  constructor(roomName) {
    this.name = roomName;
    this.messages = [];
    this.players = [];
    this.playerOrder = {};
  }


  addPlayer(playerName, socketId) {
    //check for duplicate player names
    let player = this.players.find(e => e.name === playerName);

    if (!player) {
      player = new Player(playerName,socketId,this.players.length);
      this.players.push(player)
    }else{
      player.socketId = socketId;
    }

    return player;
  }

  addMessage(playerName, message) {
    this.messages.push({
      playerName: playerName,
      message: message
    })
  }
}