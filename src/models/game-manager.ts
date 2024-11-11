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
  private players: Player[]=[];
  private stake: Stake;
  private starter: Player;

  private failSafe: number=0;

  constructor(map: Map){
    this.map=map;
    this.stake = new FixLimitStake(this);
    for(let i = 0; i<this.playerCount; i++){
      /*if(i==0){
        this.players.push(new HumanPlayer(this.stake));
        continue;
      } */
      this.players.push(new ArtificialPlayer(this.stake));
    }
    this.stake.addPlayers(this.players);    
  }

  public startGame(){
    if(this.playerCount < 3){
    this.starter=this.players[0];
    }
    else this.starter=this.players[2];
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
      for(let i=0; i<this.players.length; i++){
        let player = this.players[i];      
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
    let newStarter = this.players.splice(0,1)[0];
    this.players.push(newStarter);
    this.starter=newStarter;
    this.stake.addPlayers(this.players);
  }

  

  public calculateWinner(){
    let communityCards=this.map.getCommunityCards();
    console.log("Game over");
    
  }

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