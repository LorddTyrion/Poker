import { Slot } from './slot';
import { Map } from './map';
import { Card } from './card';
import { logError } from '../../models/log';

export class PokerRow {
  public index: number;
  public map: Map;
  public slots: Slot[] = [];
  public cards: Card[] = [];

  constructor(map: Map, index: number) {
    this.map = map;
    this.index = index;
  }

  public addSlot(slot: Slot) {
    if (this.slots.length >= 5) return;
    this.slots.push(slot);
  }
  public addCard(card: Card) {
    if (this.cards.length >= 5) return;
    this.cards.push(card);
  }

  public isFull(): number {
    for (const slot of this.slots) {
      if (slot.cards.length == 0) return -1;
    }

    const score = this.calculateScore(this.cards);
    return score;
  }

  @logError()
  public calculateScore(cards: Card[]): number {
    if (this.checkStraight(cards) && this.checkColor(cards)) return 30;
    if (this.checkStraight(cards)) return 12;
    if (this.checkColor(cards)) return 5;
    let cardValues: number[] = [];
    for (let i = 0; i < 13; i++) {
      cardValues.push(0);
    }
    for (const card of cards) {
      cardValues[card.value - 1]++;
    }
    let max = Math.max(...cardValues);
    if (max == 4) return 16;

    let pairs = 0;
    for (const value of cardValues) {
      if (value == 2) pairs++;
    }

    if (max == 3 && pairs == 1) return 10;
    if (max == 3) return 6;
    if (pairs == 2) return 3;
    if (pairs == 1) return 1;
    return 0;
  }

  private checkColor(cards: Card[]): boolean {
    let color = cards[0].symbol;
    for (let i = 1; i < cards.length; i++) {
      if (cards[i].symbol != color) return false;
    }
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
    return true;
  }
}
