import { Card } from "../components/component-game-poker-squares/card";
import { Stake } from "./stake";

export abstract class Player{
    private money: number=20;
    private betCurrentRound: number;
    private activePlayer: boolean=true;
    private live: boolean=false;
    private cards: Card[] = [];
    protected stake: Stake;

    constructor(stake: Stake){
        this.stake=stake;
        this.money=20;
        this.activePlayer=true;
        this.live=false;
    }

    public GetMoney(): number{
        return this.money;
    }
    public GetCurrentBet(): number{
        return this.betCurrentRound;
    }
    public SetCurrentBet(amount: number){
        this.betCurrentRound=amount;
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
    public AddCard(card: Card){
        this.cards.push(card);
    }
    public GetCards(): Card[]{
        return this.cards;
    }
    public CollectMoney(amount: number): boolean{
        if(amount > this.money) return false;
        this.money -= amount;
        return true;
    }

    public async Step(): Promise<void> {}
}