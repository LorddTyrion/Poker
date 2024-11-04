import { ICardMoveInfo, ISlot } from './slot';
import { Map } from './map';
import { History } from './history';
import { Card } from './card';
import * as PIXI from 'pixi.js';
import { logError } from '../../models/log';

export class ShowSlot extends PIXI.Container implements ISlot {
  private map: Map;
  private bgParams: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  public cards: Card[] = [];

  constructor(map: Map) {
    super();
    this.map = map;
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
  }

  @logError()
  public addCard(cards: Card[]): boolean {
    //if (this.cards.length !== 0) return false;
    const origSlot = cards[0].slot;
    for (const card of cards) {
      if (card.slot) {
        card.slot.removeCard(card);
      }
      this.cards.push(card);
      card.setOwner(this);
      card.displayed = true;
      card.moveable = true;
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

  public cardClicked(_: Card) {
    this.map.checkFinish();
  }

  public cardMoved(card: Card, pos: { x: number; y: number }) {
    if (!card.displayed) return; // hidden cards won't move
    const info: ICardMoveInfo = {
      cards: this.cards.slice(this.cards.length - 1, this.cards.length),
      origSlot: this,
      offset: {
        x: pos.x - card.position.x,
        y: pos.y - card.position.y,
      },
      origPos: { x: card.position.x, y: card.position.y },
      distanceBetweenCards: 0, // only 1 card can move here so... no need for this distance
    };
    this.map.cardsMoved(info);
  }

  public getTopCard(): Card {
    return this.cards[this.cards.length - 1];
  }
}
