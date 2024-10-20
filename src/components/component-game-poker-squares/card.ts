import { Delay, MoveBy, Sequence, scheduler } from '../../../anim';
import { res } from './poker-squares-init';
import { ISlot } from './slot';
import * as PIXI from 'pixi.js';

export class Card extends PIXI.Container {
  public symbol: Symbol;
  public value: number; // A 2 3 4 5 6 7 8 9 10 J Q K, A = 1
  public slot: ISlot;

  private mouseDownPos: { x: number; y: number };
  private moving: boolean = false;
  private _displayed: boolean = true;
  private _moveable: boolean = false;
  private front: PIXI.Sprite;
  private back: PIXI.Sprite;

  constructor(symbol: Symbol, value: number, loader: PIXI.Loader) {
    super();
    const texture: PIXI.Texture = loader.resources[res.cards].texture.clone();
    const w = texture.width / 13;
    const h = texture.height / 5;

    this.front = new PIXI.Sprite(Card.getFramedTexture(symbol, value, loader));
    this.front.scale.set(100 / w, 140 / h);
    this.back = new PIXI.Sprite(Card.getFramedTexture(Symbol.backSide, 0, loader));
    this.back.scale.set(100 / w, 140 / h);
    if (this._displayed) this.addChild(this.front);
    else this.addChild(this.back);
    this.symbol = symbol;
    this.value = value;

    this.interactive = true;
    this.on('pointerdown', this.onMouseDown, this);
    this.on('pointerup', this.onClick, this);
  }

  /**
   * Cuts out the right card from the big picture which contains all the cards.
   * 2906 X 1564 px
   */
  private static getFramedTexture(symbol: Symbol, value: number, loader: PIXI.Loader): PIXI.Texture {
    const texture: PIXI.Texture = loader.resources[res.cards].texture.clone();
    const w = texture.width / 13;
    const h = texture.height / 5;
    let x = w * (value - 1);
    let y = h * symbol;
    if (symbol === Symbol.backSide) {
      x = 0;
    }
    texture.frame = new PIXI.Rectangle(x, y, w, h);
    return texture;
  }

  private onMouseDown(e) {
    this.mouseDownPos = {
      x: e.data.global.x,
      y: e.data.global.y,
    };
    this.on('pointermove', this.onMouseMove, this);
  }

  private onMouseMove(e) {
    const movePos = { x: e.data.global.x, y: e.data.global.y };
    if (Math.abs(this.mouseDownPos.x - movePos.x) > 5 || Math.abs(this.mouseDownPos.y - movePos.y) > 5) {
      this.moving = true;
      this.off('pointermove', this.onMouseMove, this);
      this.slot.cardMoved(this, movePos);
    }
  }

  private onClick() {
    if (!this.moving) {
      this.off('pointermove', this.onMouseMove, this);
      this.slot.cardClicked(this);
    } else {
      this.moving = false;
    }
  }

  public moveBy(pos: PIXI.Point): Promise<PIXI.Container> {
    this.interactive = false;
    const anim = new Sequence([new Delay().setDuration(100), new MoveBy(pos).setDuration(500), new Delay().setDuration(100)]);
    return scheduler.run(anim, this);
  }

  public setOwner(slot: ISlot) {
    this.slot = slot;
  }

  public get color(): Color {
    if (this.symbol === Symbol.club || this.symbol === Symbol.spade) {
      return Color.black;
    }
    return Color.red;
  }

  public get displayed(): boolean {
    return this._displayed;
  }

  public set displayed(value: boolean) {
    if (value === this._displayed) return;

    this.removeChildren();
    this._displayed = value;
    this.addChild(this._displayed ? this.front : this.back);
  }
  public get moveable(): boolean {
    return this._moveable;
  }
  public set moveable(value: boolean) {
    if (value === this._moveable) return;
    this._moveable = value;
  }
}

export enum Symbol {
  club,
  spade,
  heart,
  diamond,
  backSide,
}

export enum Color {
  red,
  black,
}
