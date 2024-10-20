import { Card } from './card';
import { Map } from './map';
import { History } from './history';
import { PokerRow } from './poker-row';
import * as PIXI from 'pixi.js';
import { logError } from '../../models/log';

export class Slot extends PIXI.Container implements ISlot {
  protected bgParams: {
    color: number;
    width: number;
    height: number;
    x: number;
    y: number;
  };
  public cards: Card[] = [];

  constructor(private map: Map, private col: PokerRow, private row: PokerRow, private idx: number, bgColor?: number) {
    super();
    col.addSlot(this);
    row.addSlot(this);
    let color = bgColor;
    if (bgColor == null) color = 0x61a92e;
    this.bgParams = { color, height: 140, width: 100, x: 0, y: 0 };
    const bg = new PIXI.Graphics();
    this.addChild(bg);

    bg.beginFill(this.bgParams.color);
    bg.drawRoundedRect(this.bgParams.x, this.bgParams.y, this.bgParams.width, this.bgParams.height, 12);
    bg.endFill();
    bg.interactive = true;
    let index = this.idx;
    bg.on('pointerdown', function () {
      map.addCardToSlot(index);
    });
  }

  @logError()
  public addCard(cards: Card[], forceHidden: boolean = false): boolean {
    const origSlot = cards[0].slot;
    let cardRevealed: Card;
    for (const card of cards) {
      this.cards.push(card);
      if (origSlot) cardRevealed = origSlot.removeCard(card);
      card.setOwner(this);
      card.moveable = false;
      this.addChild(card);
    }

    if (origSlot) History.Add({ from: origSlot, cards, cardRevealed });

    if (!forceHidden) {
      this.getTopCard().displayed = true;
    }

    this.col.addCard(cards[0]);
    this.row.addCard(cards[0]);
    let score1 = this.col.isFull();
    let score2 = this.row.isFull();
    this.map.checkForMistakes(cards[0], Math.floor(this.idx / 5), this.idx % 5, Math.max(score1, score2));
    return true;
  }

  @logError()
  public removeCard(card: Card): Card {
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i] == card) {
        this.cards.splice(i, 1);
      }
    }
    if (this.getTopCard()) {
      this.getTopCard().displayed = true;
      return this.getTopCard();
    }
  }

  public cardClicked(_: Card) {}

  public getTopCard(): Card {
    return this.cards[this.cards.length - 1];
  }

  public cardMoved(card: Card, pos: { x: number; y: number }) {
    const index: number = this.cards.indexOf(card);
    //checking the card order in the touched stack
    for (let i = index; i < this.cards.length - 1; i++) {
      if (this.cards[i].value !== this.cards[i + 1].value + 1) return;
    }
    const info: ICardMoveInfo = {
      cards: this.cards.slice(index, this.cards.length),
      origSlot: this,
      offset: {
        x: pos.x - card.position.x,
        y: pos.y - card.position.y,
      },
      origPos: { x: card.position.x, y: card.position.y },
      distanceBetweenCards: this.cards[index + 1] ? this.cards[index + 1].position.y - card.position.y : 0,
    };
    this.map.cardsMoved(info);
  }

  public acceptsCards(pos: { x: number; y: number }) {
    if (this.cards.length !== 0) return false;
    const containsPoint = this.containsssPoint(pos);
    return containsPoint;
  }

  public containsssPoint(p: { x: number; y: number }): boolean {
    const x = p.x - this.getBounds().x + this.bgParams.x;
    const y = p.y - this.getBounds().y + this.bgParams.y;
    const inside = x > 0 && x < this.getBounds().width && y > 0 && y < this.getBounds().height;
    if (inside) return true;
    const isNear = Math.abs(x) < 10 && Math.abs(y) < 10;
    return isNear;
  }
}

export interface ICardMoveInfo {
  cards: Card[];
  origSlot: ISlot;
  offset: { x: number; y: number };
  origPos: { x: number; y: number };
  distanceBetweenCards: number;
}

export interface ISlot {
  cardMoved(card: Card, pos: { x: number; y: number }): void;
  cardClicked(card: Card): void;
  addCard(card: Card[]): boolean;
  removeCard(card: Card): Card;
  getTopCard(): Card;
}
