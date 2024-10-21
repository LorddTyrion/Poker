import { Card } from "../components/component-game-poker-squares/card";
import { HandNames } from "./hand-names";
import { logError } from "./log";

export class GameManager{

    public chooseBestHand(card1: Card, card2: Card, communityCards: Card[]): HandNames{
        //console.log(communityCards);
        let tryHand=communityCards;
        let bestHand=this.calculateHand(tryHand);
        for(let i=0; i<communityCards.length; i++){
            tryHand=[];
            tryHand.push(card1);
            for(let j=0; j<communityCards.length; j++){
                if(j==i) continue;
                tryHand.push(communityCards[j]);
            }
            bestHand=this.calculateHand(tryHand) > bestHand ? this.calculateHand(tryHand): bestHand;

            tryHand=[];
            tryHand.push(card2);
            for(let j=0; j<communityCards.length; j++){
                if(j==i) continue;
                tryHand.push(communityCards[j]);
            }
            bestHand=this.calculateHand(tryHand) > bestHand ? this.calculateHand(tryHand): bestHand;

            
            for(let j=0; j<communityCards.length; j++){
                if(j==i) continue;
                tryHand=[];
                tryHand.push(card1);
                tryHand.push(card2);
                for(let k=0; k<communityCards.length; k++){
                    if( k==i || k==j) continue;
                    tryHand.push(communityCards[k]);
                }
                bestHand=this.calculateHand(tryHand) > bestHand ? this.calculateHand(tryHand): bestHand;
            } 
        }
        console.log(bestHand.toString());
        return bestHand;
    }

    @logError()
    public calculateHand(cards: Card[]): HandNames {
      console.log(cards.length);
      if (this.checkStraight(cards) && this.checkColor(cards)) return HandNames.STRAIGHT_FLUSH;
      if (this.checkStraight(cards)) return HandNames.STRAIGHT;
      if (this.checkColor(cards)) return HandNames.FLUSH;
      let cardValues: number[] = [];
      for (let i = 0; i < 13; i++) {
        cardValues.push(0);
      }
      for (const card of cards) {
        cardValues[card.value - 1]++;
      }
      let max = Math.max(...cardValues);
      //console.log(cardValues);
      if (max == 4) return HandNames.POKER;
  
      let pairs = 0;
      for (const value of cardValues) {
        if (value == 2) pairs++;
      }
  
      if (max == 3 && pairs == 1) return HandNames.FULL_HOUSE;
      if (max == 3) return HandNames.DRILL;
      if (pairs == 2) return HandNames.TWO_PAIRS;
      if (pairs == 1) return HandNames.ONE_PAIR;
      cardValues=[];
      pairs=0;
      return HandNames.NOTHING;
    }
  
    private checkColor(cards: Card[]): boolean {
      let color = cards[0].symbol;
      for (let i = 1; i < cards.length; i++) {
        if (cards[i].symbol != color) return false;
      }
      //console.log("Flush");
      return true;
    }
  
    private checkStraight(cards: Card[]): boolean {
      let nums: number[] = [];
      for (const card of cards) {
        nums.push(card.value);
      }
      nums.sort((n1, n2) => n1 - n2);
  
      for (let i = 0; i < nums.length; i++) {
        if (i > 0 && nums[i] != nums[i - 1] + 1) return false;
      }
      //console.log("Straight"+nums);
      return true;

    }
}