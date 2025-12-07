import { Card, Symbol } from "../components/component-game-poker-squares/card";
import { GameManager } from "./game-manager";
import { Oracle } from "./oracle";

export class ClientOracle extends Oracle{
    constructor(gameManager: GameManager){
        super(gameManager)     
    }
    public override async SuggestMove(card1: Card, card2: Card, communityCards: Card[]): Promise<number> {
       
        const response = await fetch("http://localhost:8000/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ 
                        history: this.gameManager.stake.actions,
                        ownCards: [
                            {
                                suit: this.symbolToString(card1.symbol),
                                rank: card1.value
                            },
                            {
                                suit: this.symbolToString(card2.symbol),
                                rank: card2.value
                            }
                        ],
                        flop: communityCards[0]?[
                            {
                                suit: this.symbolToString(communityCards[0].symbol),
                                rank: communityCards[0].value
                            },
                            {
                                suit: this.symbolToString(communityCards[1].symbol),
                                rank: communityCards[1].value
                            },
                            {
                                suit: this.symbolToString(communityCards[2].symbol),
                                rank: communityCards[2].value
                            }
                        ] : null,
                        turn: communityCards[3] ? {
                            suit: this.symbolToString(communityCards[3].symbol),
                            rank: communityCards[3].value
                        } : null,
                        river: communityCards[4] ? {
                            suit: this.symbolToString(communityCards[4].symbol),
                            rank: communityCards[4].value
                        }: null,
                        round: this.gameManager.stake.round,
                        pot: [20 - this.gameManager.stake.players[0].GetMoney(), 20-this.gameManager.stake.players[1].GetMoney()]
                    })
                });
        const data = await response.json();
        const move = data["pokerMove"] ?? "";
        if (move === "bet") return 1;
        if (move === "pass") return 2;  
        return 3;
    }
    private symbolToString(symbol: Symbol): string{
        switch(symbol){
            case Symbol.club:
                return "club";
            case Symbol.heart:
                return "heart";
            case Symbol.spade:
                return "spade";
            case Symbol.diamond:
                return "diamond";
            default:
                return "club";
        }
    }
}