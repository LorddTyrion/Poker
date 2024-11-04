import { Player } from "./player";
import { Stake } from "./stake";

export class HumanPlayer extends Player{
    constructor(stake: Stake){
        super(stake);
    }
}