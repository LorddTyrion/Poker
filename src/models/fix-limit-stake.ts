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
    private maxRaises: number=4;
    private raises: number=0;
    constructor(gameManager: GameManager){
        super(gameManager);
    }
    public override initializeRound(bigBets: boolean): void {
        this.bigBets=bigBets;
        this.highestBet=0;
        this.checkCount=0;
        this.raises=0;
        this.opened=false;
        for(let i=0; i< this.players.length; i++){
            this.players[i].SetLive(false);
            this.players[i].SetCurrentBet(0);
        }
        
    }

    public override collectStarterBets(): void {
        this.players[0].CollectMoney(this.smallBlind);//Small blind
        this.players[0].SetCurrentBet(this.smallBlind); 
        this.players[1].CollectMoney(this.bigBlind); //Big blind
        this.players[1].SetCurrentBet(this.bigBlind)
        this.pot += (this.smallBlind + this.bigBlind);
        this.highestBet=this.bigBlind;
        console.log("Pot: " + this.pot);
        for(let i=0; i< this.players.length; i++){
            this.players[i].SetLive(true);
            this.players[i].SetActive(true);
        }
        this.opened=true;
    }
    public override Bet(amount: number, player: Player): boolean{
        console.log("Bet attempt")
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
        for(let i=0; i< this.players.length; i++){
            this.players[i].SetLive(true);
        }
        player.SetLive(false);
        this.highestBet=actualAmount;
        player.SetCurrentBet(actualAmount);
        this.opened=true;
        console.log("Bet success")
        return true;
    }

    public override Call(player: Player): boolean{
        console.log("Call attempt")
        let difference = this.highestBet - player.GetCurrentBet();
        let success = player.CollectMoney(difference);
        if(!success) return false;
        this.pot += difference;
        player.SetCurrentBet(this.highestBet);
        player.SetLive(false);
        console.log("Call success")
        return true;
    }

    public override Raise(amount: number, player: Player): boolean {
        console.log("Raise attempt")
        if(this.maxRaises <= this.raises) return false;
        let actualAmount= this.bigBets ? this.bigBetAmount : this.smallBetAmount;
        let difference = this.highestBet - player.GetCurrentBet();
        actualAmount += difference;

        let success = player.CollectMoney(actualAmount);
        if(!success) return false;
        this.pot += actualAmount;

        for(let i=0; i< this.players.length; i++){
            this.players[i].SetLive(true);
        }
        player.SetLive(false);
        this.highestBet=actualAmount + player.GetCurrentBet();
        player.SetCurrentBet(this.highestBet);
        this.raises++;
        console.log("Raise success")
        return true;
    }
    public override Fold(player: Player): boolean {
        player.SetLive(false);
        player.SetActive(false);
        console.log("Fold success")
        return true;
    }

    public override Check(player: Player): boolean{
        console.log("Check attempt")
        if(this.opened) return false;
        this.checkCount++;
        console.log("Check success")
        return true;
    }

    public override RoundActive(): boolean {
        let areThereLivePlayers=false;
        console.log(this.players)
        this.players.forEach(pl =>{
            console.log(pl);
            if(pl.GetLive()) areThereLivePlayers=true;
        }
        )
        if(this.opened && !areThereLivePlayers){
            //console.log("Failed at 1", this.opened, areThereLivePlayers);
            return false;
        } 
        if(!this.opened && this.checkCount>=this.players.length){
             return false;
        }
        return true;
    }

    public override GameActive(): boolean {
        let activePlayers = 0;
        this.players.forEach(pl =>{
            if(pl.GetActive()) activePlayers++;
        }
        )
        return activePlayers>1;
    }

}