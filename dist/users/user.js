"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const { v4: uuidv4 } = require('uuid');
class User {
    constructor(name, socketId, type) {
        this.name = name;
        this.socketId = socketId;
        this.id = uuidv4();
        this.type = type;
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map