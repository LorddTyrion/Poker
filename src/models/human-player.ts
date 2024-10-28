import { Player } from "./player";
import { Stake } from "./Stake";

export class HumanPlayer extends Player{
    constructor(stake: Stake){
        super(stake);
    }
}