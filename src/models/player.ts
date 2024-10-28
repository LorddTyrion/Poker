import { Card } from "../components/component-game-poker-squares/card";
import { Stake } from "./Stake";

export abstract class Player{
    private money: number;
    private activePlayer: boolean=true;
    private cards: Card[] = [];
    protected stake: Stake;

    constructor(stake: Stake){
        this.stake=stake;
    }

    public GetMoney(): number{
        return this.money;
    }
    
    public GetActive(): boolean{
        return this.activePlayer;
    }

    public GetCards(): Card[]{
        return this.cards;
    }

    public Step(): void {}
}