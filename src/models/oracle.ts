import { Card } from "../components/component-game-poker-squares/card";
import { GameManager, HandValue } from "./game-manager";
import { HandNames } from "./hand-names";


export class Oracle{
    private gameManager: GameManager
     constructor(gameManager: GameManager){
        this.gameManager=gameManager;
     }
    public async SuggestMove(card1: Card, card2: Card, communityCards: Card[]): Promise<number>{
        // const response = await fetch("http://localhost:8000/hello");
        // const data = await response.json();
        // console.log(data);
        let len = communityCards.length;
        if(len == 0){
            return this.cautiousSuggestion();
        }
        else if(len == 3){
            let handValue: HandValue = this.gameManager.calculateHand([...communityCards, card1, card2]);
            console.log(handValue);
            let value: HandNames = handValue.mainValue;
            if(value >=4) return this.braveSuggestion();
            else return this.cautiousSuggestion();
        }
        else if(len == 4){
            let cards = [...communityCards, card1, card2];
            for(let i = 0; i < cards.length; i++){
                let tryCards = [];
                for(let j = 0; j < cards.length; j++){
                    if(i!=j) tryCards.push(cards[j]);
                }
                let handValue: HandValue = this.gameManager.calculateHand(tryCards);
                let value: HandNames=handValue.mainValue;
                if(value >=4) return this.braveSuggestion();
            }
            return this.cautiousSuggestion();
        }
        else{
            let bestHand= this.gameManager.chooseBestHand(card1, card2, communityCards);
            let value: HandNames=bestHand.mainValue;
            if(value >=4) return this.braveSuggestion();
            else return this.cautiousSuggestion();
        }
    }


    private cautiousSuggestion(){
        let rand = Math.floor(Math.random() * 100)+1;
        if(rand <30 ){
            return 1;
        }
        else if(rand < 90){
            return 2;
        }
        else return 3;

    }

    private braveSuggestion(){
        let rand = Math.floor(Math.random() * 100)+1;
        if(rand <50 ){
            return 1;
        }
        else if(rand < 90){
            return 2;
        }
        else return 3;

    }
}