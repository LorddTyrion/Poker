import { Card } from "../components/component-game-poker-squares/card";
import { Stake } from "./stake";

export abstract class Player{
    private money: number;
    private betCurrentRound: number;
    private activePlayer: boolean=true;
    private live: boolean=true;
    private cards: Card[] = [];
    protected stake: Stake;

    constructor(stake: Stake){
        this.stake=stake;
    }

    public GetMoney(): number{
        return this.money;
    }
    public GetCurrentBet(): number{
        return this.betCurrentRound;
    }
    
    public GetActive(): boolean{
        return this.activePlayer;
    }
    public SetActive(active: boolean){
        this.activePlayer=active;
    }
    public GetLive(): boolean{
        return this.live;
    }
    public SetLive(live: boolean){
        this.live=live;
    }

    public GetCards(): Card[]{
        return this.cards;
    }
    public CollectMoney(amount: number): boolean{
        if(amount > this.money) return false;
        this.money -= amount;
        return true;
    }

    public Step(): void {}
}