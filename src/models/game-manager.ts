import { Card } from "../components/component-game-poker-squares/card";
import { ArtificialPlayer } from "./artificial-player";
import { FixLimitStake } from "./fix-limit-stake";
import { HandNames } from "./hand-names";
import { HumanPlayer } from "./human-player";
import { logError } from "./log";
import { Player } from "./player";
import { Stake } from "./stake";
import {Map} from "../components/component-game-poker-squares/map";

export class GameManager{
  private map: Map;
  private playerCount: number=2;
  private playersOriginal: Player[]=[];
  private playersActual: Player[]=[];
  private stake: Stake;
  //private starter: Player;

  private failSafe: number=0;

  constructor(map: Map){
    this.map=map;
    this.stake = new FixLimitStake(this);
    for(let i = 0; i<this.playerCount; i++){
      /*if(i==0){
        this.players.push(new HumanPlayer(this.stake));
        continue;
      } */
      let player =new ArtificialPlayer(this.stake);
      this.playersActual.push(player);
      this.playersOriginal.push(player);
    }
    this.stake.addPlayers(this.playersOriginal);    
  }

  public assignCards(cards: Card[]){
    for(let i = 0; i<cards.length; i++){
      this.playersOriginal[Math.floor(i/2)].AddCard(cards[i]);
    }
  }

  public startGame(){
    if(this.playerCount < 3){
    //this.starter=this.playersActual[0];
    }
    //else this.starter=this.playersActual[2];
    this.stake.collectStarterBets();
    for(let i = 0; i<2; i++) this.rotatePlayers();
    console.log("Game started");

  }

  public async manageGame(){
    console.log("Game created");

    this.startGame();
    await this.bettingRound(); //pre-flop
    this.rotatePlayers();
    //flop
    await this.map.deckSlot.dealCards();
    this.stake.initializeRound(false);
    await this.bettingRound();
    this.rotatePlayers();
    //turn
    await this.map.deckSlot.dealCards();
    this.stake.initializeRound(true);
    await this.bettingRound();
    this.rotatePlayers();
    //river
    await this.map.deckSlot.dealCards();
    this.stake.initializeRound(true);
    await this.bettingRound();
    this.calculateWinner();
  }

  private async bettingRound(){
    this.failSafe=0;
    console.log("Betting round entered");
    if(!this.stake.GameActive()){
      console.log("Not enough players");
      return; 
    }      
    while(this.stake.RoundActive()){
      this.failSafe++;
      console.log("In while loop"); //Betting while there are active players
      for(let i=0; i<this.playersActual.length; i++){
        let player = this.playersActual[i];      
        if(player.GetActive()){
          //console.log("In if statement");
          await player.Step();
        }
        if(!this.stake.RoundActive()){
          console.log("Betting round exited");
          return; 
        } 
        if(!this.stake.GameActive()){
          console.log("Not enough players");
          return; 
        }        
      }    
      if(this.failSafe >= 10) {
        console.log("Failsafe activated");
        return;
      }
    }
  }

  private rotatePlayers(){
    console.log(this.playersActual);
    let newStarter = this.playersActual.splice(0,1)[0];
    this.playersActual.push(newStarter);
    console.log(this.playersActual);
    //this.starter=newStarter;
    this.stake.addPlayers(this.playersActual);
  }

  

  public calculateWinner(){
    let communityCards=this.map.getCommunityCards();
    console.log("Game over");
    let bestHands: HandValue[]=[];
    for(let i=0; i<this.playersOriginal.length; i++){
      bestHands.push(this.chooseBestHand(this.playersOriginal[i].GetCards()[0], this.playersOriginal[i].GetCards()[1], communityCards));      
    }
    let bestHand=bestHands[0];
    for(let i=0; i<bestHands.length; i++){
      bestHand=this.tiebreak(bestHands[i], bestHand);
    }    
    let winnerIndex=bestHands.indexOf(bestHand);
    console.log(`Player ${winnerIndex} is the winner`);
    console.log("Best hand ", bestHand);
    
  }

    public chooseBestHand(card1: Card, card2: Card, communityCards: Card[]): HandValue{
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
            let tryHandValue: HandValue=this.calculateHand(tryHand);
            bestHand=this.tiebreak(tryHandValue, bestHand);

            tryHand=[];
            tryHand.push(card2);
            for(let j=0; j<communityCards.length; j++){
                if(j==i) continue;
                tryHand.push(communityCards[j]);
            }
            tryHandValue=this.calculateHand(tryHand);
            bestHand=this.tiebreak(tryHandValue, bestHand);

            
            for(let j=0; j<communityCards.length; j++){
                if(j==i) continue;
                tryHand=[];
                tryHand.push(card1);
                tryHand.push(card2);
                for(let k=0; k<communityCards.length; k++){
                    if( k==i || k==j) continue;
                    tryHand.push(communityCards[k]);
                }
                tryHandValue=this.calculateHand(tryHand);
                bestHand=this.tiebreak(tryHandValue, bestHand);
            } 
        }
        console.log(bestHand.toString());
        return bestHand;
    }

    private tiebreak(tryHandValue: HandValue, bestHand: HandValue): HandValue{
      console.log("Tried hand ", tryHandValue);
      console.log("Best hand ", bestHand);
      if(!tryHandValue) return bestHand;
      if(tryHandValue.mainValue > bestHand.mainValue) return tryHandValue;
      else if(tryHandValue.mainValue == bestHand.mainValue){
        for(let t=0; t<tryHandValue.tieBreak.length; t++){
          if(tryHandValue.tieBreak[t] > bestHand.tieBreak[t]){
            return tryHandValue;
          }
        }
      }
      return bestHand;
      
    }

    @logError()
    public calculateHand(cards: Card[]): HandValue {
      //console.log(cards.length);
      let straight =this.checkStraight(cards);
      let flush=this.checkColor(cards);
      if (straight[0] && flush[0]){
          return {
            mainValue: HandNames.STRAIGHT_FLUSH,
            tieBreak: [straight[1]]
          };
      } 
      if (straight[0]) 
        return {
          mainValue: HandNames.STRAIGHT,
          tieBreak: [straight[1]]
        };
      if (flush[0]) 
        return {
          mainValue: HandNames.FLUSH,
          tieBreak: flush[1]
        };
      let cardValues: number[] = [];
      for (let i = 0; i < 13; i++) {
        cardValues.push(0);
      }
      for (const card of cards) {
        cardValues[card.value - 1]++;
      }
      let max = Math.max(...cardValues);
      let maxInd=cardValues.indexOf(max)+1;
      //console.log(cardValues);
      if (max == 4){
        let kickerInd=cardValues.indexOf(1)+1;
        return {
          mainValue: HandNames.POKER,
          tieBreak: [maxInd, kickerInd]
        };
      } 
  
      let pairs = 0;
      let pairInd:number[] = [];
      for (let i=0; i<cardValues.length; i++) {
        let value=cardValues[i];
        if (value == 2) {
          pairs++;
          pairInd.push(i+1);
        }
      }
  
      if (max == 3 && pairs == 1) {
        let kickerInd=cardValues.indexOf(2)+1;
        return {
          mainValue: HandNames.FULL_HOUSE,
          tieBreak: [maxInd, kickerInd]
        };
      } 
      if (max == 3){
        let kickerInd2=cardValues.indexOf(1)+1;
        cardValues[kickerInd2-1]=0;
        let kickerInd1=cardValues.indexOf(1)+1;
        return {
          mainValue: HandNames.DRILL,
          tieBreak: [maxInd, kickerInd1, kickerInd2]
        };
      } 
      if (pairs == 2) {
        pairInd.sort((n1, n2) => n2-n1);
        let kickerInd=cardValues.indexOf(1)+1;
        return {
          mainValue: HandNames.TWO_PAIRS,
          tieBreak: [pairInd[0], pairInd[1], kickerInd]
        };
      }

      let nums: number[] = [];
      for (const card of cards) {
        nums.push(card.value);
      }
      nums.sort((n1, n2) => n2-n1);


      if (pairs == 1) {        
        nums= nums.filter(n => n!=pairInd[0]);      
        return {
          mainValue: HandNames.ONE_PAIR,
          tieBreak: [pairInd[0], nums[0], nums[1], nums[2]]
        };
      }

      cardValues=[];
      pairs=0;

      return {
        mainValue: HandNames.NOTHING,
        tieBreak: nums
      };
    }
  
    private checkColor(cards: Card[]):[boolean, number[]] {
      let nums: number[] = [];
      for (const card of cards) {
        nums.push(card.value);
      }
      nums.sort((n1, n2) => n2-n1);
      let color = cards[0].symbol;
      for (let i = 1; i < cards.length; i++) {
        if (cards[i].symbol != color) return [false, []];
      }
      //console.log("Flush");
      return [true, nums];
    }
  
    private checkStraight(cards: Card[]): [boolean, number] {
      let nums: number[] = [];
      for (const card of cards) {
        nums.push(card.value);
      }
      nums.sort((n1, n2) => n1 - n2);
  
      for (let i = 0; i < nums.length; i++) {
        if (i > 0 && nums[i] != nums[i - 1] + 1) return [false, 0];
      }
      //console.log("Straight"+nums);
      return [true, nums[nums.length-1]];

    }
}

export class HandValue{
  public mainValue: HandNames;
  public tieBreak: number[]=[];
}