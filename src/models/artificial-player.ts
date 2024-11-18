import { Oracle } from "./oracle";
import { Player } from "./player";
import { Stake } from "./stake";

export class ArtificialPlayer extends Player{
    constructor(stake: Stake){
        super(stake);
    }
    public override async Step(): Promise<void>{
        let oracle = new Oracle();
        
        let suggestion=oracle.SuggestMove();
        console.log("step "+suggestion);
        //await this.delay(1000);
        if(suggestion <30 ){
            let success= this.stake.Bet(1, this);
            if(!success) success = this.stake.Raise(1, this);
            if(!success) this.stake.Fold(this);
        }
        else if(suggestion < 90){
            let success=this.stake.Check(this);
            if(!success) success = this.stake.Call(this);
            if(!success) this.stake.Fold(this); 
        }
        else this.stake.Fold(this);
        /*switch (suggestion){
            case 1: {
                let success= this.stake.Bet(1, this);
                if(!success) success = this.stake.Raise(1, this);
                if(!success) this.stake.Fold(this);
                break;
            }
            case 2: {
                let success=this.stake.Check(this);
                if(!success) success = this.stake.Call(this);
                if(!success) this.stake.Fold(this); 
                break;
            }
            case 3: this.stake.Fold(this); break;
            default: break;
        }*/
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}