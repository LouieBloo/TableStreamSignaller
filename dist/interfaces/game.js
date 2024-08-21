"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameType = exports.GameEvent = void 0;
var GameEvent;
(function (GameEvent) {
    GameEvent[GameEvent["RandomizePlayerOrder"] = 0] = "RandomizePlayerOrder";
    GameEvent[GameEvent["ModifyLifeTotal"] = 1] = "ModifyLifeTotal";
    GameEvent[GameEvent["StartGame"] = 2] = "StartGame";
    GameEvent[GameEvent["EndCurrentTurn"] = 3] = "EndCurrentTurn";
})(GameEvent || (exports.GameEvent = GameEvent = {}));
var GameType;
(function (GameType) {
    GameType[GameType["MTGCommander"] = 0] = "MTGCommander";
})(GameType || (exports.GameType = GameType = {}));
//# sourceMappingURL=game.js.map