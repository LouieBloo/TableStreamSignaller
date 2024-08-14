const { v4: uuidv4 } = require('uuid');

module.exports = class Player {

    constructor(name, socketId, turnOrder) {
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.turnOrder = turnOrder;
    }
 
    
 }