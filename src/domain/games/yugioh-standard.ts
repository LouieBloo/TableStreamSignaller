import { GameType } from "../interfaces/IGame";
import { Game } from "./game";

export class YugiohStandard extends Game {
  startingLifeTotal = 8000;
  gameType: GameType = GameType.YugiohStandard;

  constructor() {
    super();
  }
}
