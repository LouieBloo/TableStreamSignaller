"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameErrorType = exports.GameError = exports.GameType = exports.GameEvent = exports.PlayerProperties = void 0;
var PlayerProperties;
(function (PlayerProperties) {
    PlayerProperties[PlayerProperties["lifeTotal"] = 0] = "lifeTotal";
    PlayerProperties[PlayerProperties["poisonTotal"] = 1] = "poisonTotal";
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
})(GameEvent || (exports.GameEvent = GameEvent = {}));
var GameType;
(function (GameType) {
    GameType[GameType["MTGCommander"] = 0] = "MTGCommander";
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
})(GameErrorType || (exports.GameErrorType = GameErrorType = {}));
//# sourceMappingURL=game.js.map