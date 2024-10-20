import * as PIXI from 'pixi.js';
import { Process, scheduler } from '../../../anim';
import { IGame, res } from './poker-squares-init';
import styleSheet from '../../assets/font.json';
import { parseParamTranslate } from '../../utils/translations.utils';
import { TryCounter } from './try_counter';

export class GamePanel extends PIXI.Container {
  private timer: PIXI.Text;
  private hourglass: PIXI.Sprite;
  private round: PIXI.Text;
  private recentRound: number = 1;
  private lastTs = Date.now();
  private timeInSeconds: number = 0;
  private padding = 10;
  private timerID: Process;
  private subscribers: Interruptable[] = [];
  private hastimeout: boolean = false;
  private pauseCnt: number = 0;
  private triesCntr: TryCounter;

  get recentTime() {
    return Math.floor(this.timeInSeconds * 1000);
  }
  get remainedTries() {
    return this.triesCntr?.value ?? 0;
  }
  get currRound() {
    return this.recentRound - 1;
  }

  constructor(private game: IGame, private maxRounds?: number, private maxTries?: number) {
    super();
    this.subscribe(this.game);
    const fontSize = Math.max(25, (25 * this.game.dim.w) / 900);
    this.timer = new PIXI.Text(this.timeFormat(this.timeInSeconds), {
      fontFamily: styleSheet.fontFamily,
      fontSize: fontSize,
    });

    this.timer.anchor.set(0, 0);
    this.timer.position.set(this.game.dim.w - this.padding - this.timer.getBounds().width, this.padding);
    this.hourglass = new PIXI.Sprite(this.game.loader.resources[res.hourglass].texture);
    this.hourglass.anchor.set(1, 0.5);
    this.hourglass.scale.set((this.timer.getBounds().height * 0.7) / this.hourglass.height);
    this.hourglass.position.set(this.game.dim.w - this.timer.getBounds().width - this.padding * 2, this.timer.getBounds().height / 2 + this.timer.getBounds().y);
    this.addChild(this.timer);
    this.addChild(this.hourglass);
    if (maxRounds) {
      this.round = new PIXI.Text(parseParamTranslate('round', this.game.custom_lang, this.recentRound, this.maxRounds), {
        fontFamily: styleSheet.fontFamily,
        fontSize: fontSize,
      });
      this.round.anchor.set(0, 0);
      this.round.position.set(this.padding, this.padding);
      this.addChild(this.round);
    }

    if (maxTries) {
      this.triesCntr = new TryCounter(this.maxTries);
      this.triesCntr.scale.set(this.round.height / this.triesCntr.height);
      this.triesCntr.position.set((this.round.x + this.round.width + this.hourglass.getBounds().x) / 2, this.padding + this.triesCntr.getBounds().height / 2);
      this.addChild(this.triesCntr);
    }
    this.timerID = scheduler.setInterval(500, this.tick.bind(this));
  }

  private tick() {
    if (!this.timer || this.hastimeout || this.pauseCnt !== 0) return;
    const now = Date.now();
    const dt = now - this.lastTs;
    this.lastTs = now;
    this.timeInSeconds += dt / 1000;
    this.timer.text = this.timeFormat(Math.floor(this.timeInSeconds));
  }

  private timeFormat(inSeconds: number): string {
    const h = Math.floor(inSeconds / 3600);
    const m = Math.floor((inSeconds - h * 3600) / 60);
    const s = Math.floor((inSeconds - h * 3600) % 60);
    if (m > 39) {
      this.timeout();
    }
    return `${this.zfill(m, 2)}:${this.zfill(s, 2)}`;
  }

  private zfill(num, len) {
    return (Array(len).join('0') + num).slice(-len);
  }

  public nextRound() {
    if (this.maxRounds && this.recentRound >= this.maxRounds) return;
    this.round.text = parseParamTranslate('round', this.game.custom_lang, ++this.recentRound, this.maxRounds);
    if (this.maxTries) this.triesCntr.reset();
  }

  public isLastRound() {
    return !this.maxRounds || this.recentRound >= this.maxRounds;
  }

  public handleMissedTry() {
    if (!this.maxTries) return;
    this.triesCntr.reduceTries();
  }

  public pauseTimer() {
    this.pauseCnt++;
    if (this.pauseCnt > 1) return;
    this.timerID.pause();
    const now = Date.now();
    const dt = now - this.lastTs;
    this.timeInSeconds += dt / 1000;
  }

  public resumeTimer() {
    if (!this.pauseCnt) return;
    this.pauseCnt--;
    if (this.pauseCnt > 0) return;
    this.timerID.resume();
    this.lastTs = Date.now();
  }

  public timeout() {
    this.hastimeout = true;
    for (const subscriber of this.subscribers) {
      subscriber.timeout();
    }
  }

  public subscribe(listener: Interruptable) {
    this.subscribers.push(listener);
  }

  public unsubscribe(listener: Interruptable) {
    const idx = this.subscribers.indexOf(listener);
    if (idx >= 0) this.subscribers.splice(idx, 1);
  }
}

export interface Interruptable {
  timeout(): void;
}
