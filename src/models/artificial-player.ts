import { Oracle } from "./oracle";
import { Player } from "./player";
import { Stake } from "./stake";
import { Map } from '../components/component-game-poker-squares/map';

export class ArtificialPlayer extends Player{
    private map: Map;
    constructor(stake: Stake, index: number, map: Map){
        super(stake, index);
        this.map=map;
    }
    public override async Step(): Promise<void>{
        let oracle = new Oracle(this.map.gameManager);        
        let suggestion=oracle.SuggestMove(this.GetCards()[0], this.GetCards()[1], this.map.getCommunityCards());
        console.log("step "+suggestion);
        await this.delay(5000);
        
        switch (suggestion){
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
        }
    }

    private delay(ms: number): Promise<void> {
        console.log("delay");
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}