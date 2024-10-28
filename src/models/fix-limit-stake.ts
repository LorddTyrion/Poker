import { Stake } from "./Stake";
import { GameManager } from "./game-manager";

export class FixLimitSatke extends Stake{
    constructor(gameManager: GameManager){
        super(gameManager);
    }

}