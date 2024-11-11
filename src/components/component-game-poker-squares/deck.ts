import { Card } from './card';
import { ISlot, Slot } from './slot';
import { History } from './history';
import { ShowSlot } from './showSlot';
import * as PIXI from 'pixi.js';
import { logError } from '../../models/log';
import {Map} from './map';

export class Deck extends PIXI.Container implements ISlot {
  private bgParams: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  public cards: Card[] = [];
  private slotFront: ShowSlot;
  public flopSlots: Slot[] = [];
  private cardsDealt: number=0;
  private map: Map;

  constructor(map: Map, slotFront: ShowSlot) {
    super();
    this.bgParams = {
      width: 100,
      height: 140,
      x: 0,
      y: 0,
    };
    const bg = new PIXI.Graphics();
    this.addChild(bg);

    bg.beginFill(0x61a92e);
    bg.drawRoundedRect(this.bgParams.x, this.bgParams.y, this.bgParams.width, this.bgParams.height, 12);
    bg.endFill();
    bg.interactive = true;

    this.map=map;
    this.slotFront = slotFront;

    //bg.on('pointerup', this.slotClicked, this);
  }

  @logError()
  public addCard(cards: Card[]): boolean {
    const origSlot = cards[0].slot;
    for (const card of cards) {
      if (card.slot) {
        card.slot.removeCard(card);
      }
      this.cards.push(card);
      card.setOwner(this);
      card.displayed = false;
      card.moveable = false;
      this.addChild(card);
    }
    if (origSlot) History.Add({ cards, from: origSlot });
    return true;
  }

  @logError()
  public removeCard(card: Card): Card {
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i] == card) {
        this.cards.splice(i, 1);
      }
    }
    return null;
  }

  public async cardClicked(card: Card) {
    if (this.cardsDealt>=5){
      this.map.calculateWinner();
      return;
    }
    this.burnCard();
    await this.delay(1000);
    this.dealCards();
  }

  public dealCards(){
    if(this.cardsDealt == 0){
      const cards = this.cards.splice(this.cards.length - 3, 3);
      for(let i =0; i<3; i++){
        this.flopSlots[this.cardsDealt].addCard([cards[i]]);
        this.cardsDealt ++;
      }
      
      return;
    }
    let card = this.cards.splice(this.cards.length - 1, 1);
    this.flopSlots[this.cardsDealt].addCard(card);
    this.cardsDealt++;
  }

  public burnCard(){
    if(this.cards.length == 0) return;
    let card= this.cards.splice(this.cards.length-1, 1);
    this.slotFront.addCard(card);
  }

  /*public slotClicked(): void {
    if (this.cards.length > 0) return;
    const frontCards = this.slotFront.cards.slice();
    for (const card of frontCards) {
      this.slotFront.removeCard(card);
    }
    this.addCard(frontCards);
  }*/

  public cardMoved(_card: Card, _pos: { x: number; y: number }) {}

  public getTopCard(): Card {
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
}
