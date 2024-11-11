import { Stake } from "./stake";
import { GameManager } from "./game-manager";
import { Player } from "./player";

export class FixLimitStake extends Stake{
    private bigBets: boolean=false;
    private smallBlind: number=1;
    private bigBlind: number=2;
    private smallBetAmount: number=2;
    private bigBetAmount: number=4;
    private opened: boolean=true;
    private highestBet: number=0;
    private checkCount: number=0;
    constructor(gameManager: GameManager){
        super(gameManager);
    }
    public override initializeRound(bigBets: boolean): void {
        this.bigBets=bigBets;
        this.highestBet=0;
        this.checkCount=0;
        this.opened=false;
        this.players.forEach(pl =>{
            pl.SetLive(false);
        })
    }

    public override collectStarterBets(): void {
        this.players[0].CollectMoney(this.smallBlind); //Small blind
        this.players[1].CollectMoney(this.bigBlind); //Big blind
        this.pot += (this.smallBlind + this.bigBlind);
        this.players.forEach(pl =>{
            pl.SetLive(true);
        })
    }
    public override Bet(amount: number, player: Player): boolean{
        if(this.opened) return false;
        let actualAmount = amount;
        if(this.bigBets){
          actualAmount=this.bigBetAmount;
        }
        else{
            actualAmount=this.smallBetAmount; 
        } 
        let success= player.CollectMoney(actualAmount);
        if(!success) return false;
            this.pot += actualAmount;       
        this.players.forEach(pl =>{
            pl.SetLive(true);
        })
        player.SetLive(false);
        this.highestBet=actualAmount;
        return true;
    }

    public override Call(player: Player): boolean{
        let difference = this.highestBet - player.GetCurrentBet();
        let success = player.CollectMoney(difference);
        if(!success) return false;
        this.pot += difference;
        player.SetLive(false);
        return true;
    }

    public override Raise(amount: number, player: Player): boolean {
        let actualAmount= this.bigBets ? this.bigBetAmount : this.smallBetAmount;
        let difference = this.highestBet - player.GetCurrentBet();
        actualAmount += difference;

        let success = player.CollectMoney(actualAmount);
        if(!success) return false;
        this.pot += actualAmount;

        this.players.forEach(pl =>{
            pl.SetLive(true);
        })
        player.SetLive(false);
        this.highestBet=actualAmount + player.GetCurrentBet();
        return true;
    }
    public override Fold(player: Player): boolean {
        player.SetLive(false);
        player.SetActive(false);
        return true;
    }

    public override Check(player: Player): boolean{
        if(this.opened) return false;
        this.checkCount++;
        return true;
    }

    public override RoundActive(): boolean {
        let areThereLivePlayers=false;
        this.players.forEach(pl =>{
            if(pl.GetLive() && pl.GetActive()) areThereLivePlayers=true;
        }
        )
        if(this.opened && !areThereLivePlayers) return false;
        if(!this.opened && this.checkCount==this.players.length) return false;
        return true;
    }

}