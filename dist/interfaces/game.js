"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserType = exports.GameErrorType = exports.GameError = exports.GameType = exports.GameEvent = exports.PlayerProperties = void 0;
var PlayerProperties;
(function (PlayerProperties) {
    PlayerProperties[PlayerProperties["lifeTotal"] = 0] = "lifeTotal";
    PlayerProperties[PlayerProperties["poisonTotal"] = 1] = "poisonTotal";
    PlayerProperties[PlayerProperties["energyTotal"] = 2] = "energyTotal";
})(PlayerProperties || (exports.PlayerProperties = PlayerProperties = {}));
var GameEvent;
(function (GameEvent) {
    GameEvent[GameEvent["RandomizePlayerOrder"] = 0] = "RandomizePlayerOrder";
    GameEvent[GameEvent["ModifyPlayerProperty"] = 1] = "ModifyPlayerProperty";
    GameEvent[GameEvent["StartGame"] = 2] = "StartGame";
    GameEvent[GameEvent["ResetGame"] = 3] = "ResetGame";
    GameEvent[GameEvent["EndCurrentTurn"] = 4] = "EndCurrentTurn";
    GameEvent[GameEvent["ShareCard"] = 5] = "ShareCard";
    GameEvent[GameEvent["ToggleMonarch"] = 6] = "ToggleMonarch";
    GameEvent[GameEvent["ModifyPlayerCommanderDamage"] = 7] = "ModifyPlayerCommanderDamage";
    GameEvent[GameEvent["SetCommander"] = 8] = "SetCommander";
})(GameEvent || (exports.GameEvent = GameEvent = {}));
var GameType;
(function (GameType) {
    GameType[GameType["Game"] = 0] = "Game";
    GameType[GameType["MTGCommander"] = 1] = "MTGCommander";
    GameType[GameType["MTGStandard"] = 2] = "MTGStandard";
    GameType[GameType["MTGModern"] = 3] = "MTGModern";
})(GameType || (exports.GameType = GameType = {}));
class GameError extends Error {
    constructor(type, message) {
        super(message); // Pass the message to the base Error class
        this.type = type;
    }
}
exports.GameError = GameError;
var GameErrorType;
(function (GameErrorType) {
    GameErrorType[GameErrorType["GameNotStarted"] = 0] = "GameNotStarted";
    GameErrorType[GameErrorType["InvalidAction"] = 1] = "InvalidAction";
})(GameErrorType || (exports.GameErrorType = GameErrorType = {}));
var UserType;
(function (UserType) {
    UserType[UserType["Player"] = 0] = "Player";
    UserType[UserType["Spectator"] = 1] = "Spectator";
})(UserType || (exports.UserType = UserType = {}));
//# sourceMappingURL=game.js.map