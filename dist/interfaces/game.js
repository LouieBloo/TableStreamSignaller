"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameType = exports.GameEvent = exports.PlayerProperties = void 0;
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
    GameEvent[GameEvent["EndCurrentTurn"] = 3] = "EndCurrentTurn";
    GameEvent[GameEvent["ShareCard"] = 4] = "ShareCard";
    GameEvent[GameEvent["ToggleMonarch"] = 5] = "ToggleMonarch";
    GameEvent[GameEvent["ModifyPlayerCommanderDamage"] = 6] = "ModifyPlayerCommanderDamage";
})(GameEvent || (exports.GameEvent = GameEvent = {}));
var GameType;
(function (GameType) {
    GameType[GameType["MTGCommander"] = 0] = "MTGCommander";
})(GameType || (exports.GameType = GameType = {}));
//# sourceMappingURL=game.js.map