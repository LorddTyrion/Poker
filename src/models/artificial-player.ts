import { Oracle } from "./oracle";
import { Player } from "./player";
import { Stake } from "./stake";

export class ArtificialPlayer extends Player{
    constructor(stake: Stake){
        super(stake);
    }
    public override Step(): void{
        let oracle = new Oracle();
        let suggestion=oracle.SuggestMove();
        switch (suggestion){
            case 1: this.stake.Bet(1); break;
            case 2: this.stake.Call(); break;
            case 3: this.stake.Fold(); break;
            case 4: this.stake.Raise(1); break;
            default: break;
        }
    }
}