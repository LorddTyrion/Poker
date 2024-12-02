import * as PIXI from 'pixi.js';
import { IGame, res } from './poker-squares-init';
import styleSheet from '../../assets/font.json';
import { Delay, FadeTo, Process, Sequence, scheduler } from '../../../anim';
import { GamePanel } from './game-panel';
import { translate } from '../../utils/translations.utils';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';

export class InfoManager extends PIXI.Container {
  private msg: PIXI.Text;
  private bg: PIXI.Graphics;
  private showAnim: Process;
  private skip: PIXI.Sprite;
  private timer: Timer;

  constructor(private game: IGame, private gamePanel: GamePanel, private container: any) {
    super();
    this.zIndex = 1;
    this.alpha = 0;
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0xfafafa, 0.9);
    this.bg.drawRect(0, 0, this.game.dim.w, this.game.dim.h);
    this.bg.endFill();
    this.bg.position.set(0, 0);
    this.addChild(this.bg);
    this.msg = new PIXI.Text('', {
      fontFamily: styleSheet.fontFamily,
      fontSize: 30,
      wordWrap: true,
      wordWrapWidth: Math.min(this.game.dim.w * 0.8, 500),
      align: 'center',
    });
    this.msg.anchor.set(0.5, 0.5);
    this.msg.position.set(this.game.dim.w / 2, this.game.dim.h / 2);
    this.addChild(this.msg);

    this.timer = new Timer();
    this.bg.addChild(this.timer);
    this.timer.position.set(50, 50);

    this.skip = new PIXI.Sprite();
    this.skip.anchor.set(0.5, 1);
    const skipShadow = new PIXI.Graphics();
    const skipbg = new PIXI.Graphics();
    const skipText = new PIXI.Text(translate('skip', this.game.custom_lang), {
      fontFamily: styleSheet.fontFamily,
      fontSize: 20,
      fill: '#ffffff',
    });
    this.skip.buttonMode = true;
    skipbg.beginFill(0x2b7371, 1);
    const padding = 10;
    skipShadow.beginFill(0x0, 1);
    skipShadow.drawRoundedRect(-padding * 2 + 1, -padding + 1, skipText.width + padding * 4 - 2, skipText.height + padding * 2 - 2, (skipText.height + padding * 2) / 2);
    this.skip.addChild(skipShadow);
    addShadow(skipShadow);
    skipbg.drawRoundedRect(-padding * 2, -padding, skipText.width + padding * 4, skipText.height + padding * 2, (skipText.height + padding * 2) / 2);
    skipbg.endFill();
    skipbg.addChild(skipText);
    this.skip.addChild(skipbg);
    this.addChild(this.skip);
    this.skip.position.set((this.game.dim.w - skipbg.width + 4 * padding) / 2, this.game.dim.h - skipbg.height - 2 * padding);

    this.bg.interactive = false;
    this.bg.on('pointerdown', () => {
      this.showAnim.forceFinish();
      this.timer.stop();
      this.alpha = 0;
    });

    this.skip.interactive = false;
    this.skip.on(
      'pointerdown',
      () => {
        skipbg.beginFill(0xbfc1c7, 1);
        skipbg.drawRoundedRect(-padding * 2, -padding, skipText.width + padding * 4, skipText.height + padding * 2, (skipText.height + padding * 2) / 2);
        this.game.changeNarration(false);
        this.timer.stop();
        this.showAnim.forceFinish();
      },
      this,
    );

    this.skip.on(
      'pointerup',
      () => {
        skipbg.beginFill(0x2b7371, 1);
        skipbg.drawRoundedRect(-padding * 2, -padding, skipText.width + padding * 4, skipText.height + padding * 2, (skipText.height + padding * 2) / 2);
      },
      this,
    );
  }

  public async showMsg(msg: string, disabledText: boolean = true): Promise<void> {
    console.log("Show message");
    if (!this.game.doNarration && disabledText) {
      console.log("Something's wrong, I can feel it");
      return Promise.resolve();
    }
    this.container.interactiveChildren = false;
    this.bg.interactive = true;
    this.skip.visible = disabledText;
    this.skip.interactive = disabledText;
    this.gamePanel.pauseTimer();
    this.msg.text = msg;

    const timeValue = msg.length * 60 + 3000;
    this.setShowAnimTime(timeValue);
    this.timer.scale.set(1);
    this.timer.start(Math.round(timeValue / 1000));
    this.timer.scale.set(50 / this.timer.getBounds().width);
    return scheduler.run(this.showAnim, this).then(() => {
      this.skip.interactive = false;
      this.gamePanel.resumeTimer();
      this.container.interactiveChildren = true;
      this.bg.interactive = false;
    });
  }

  public showToast(msg: string, typ: Info = Info.INFO) {
    const padding = 30;
    const container = new PIXI.Sprite();
    const colors = this.getColorStyle(typ);
    const width = Math.min(this.game.dim.w, 500);
    const text = new PIXI.Text(msg, {
      fontSize: 19,
      fontFamily: styleSheet.fontFamily,
      fill: 0x000000,
      wordWrap: true,
      wordWrapWidth: width - 90,
    });
    text.anchor.set(0, 0);
    const bg = new PIXI.Graphics();
    bg.beginFill(colors.borderColor);
    bg.drawRect(0, 0, 4, text.height + padding * 1.25);
    bg.beginFill(colors.backgroundColor);
    bg.drawRect(4, 0, width - padding - 4, text.height + padding * 1.25);
    bg.endFill();
    text.position.set(bg.height * 0.2 + 40, padding * 0.625);
    container.addChild(bg);
    container.addChild(text);
    this.switchInfoIcon(25, typ, container);
    container.alpha = 0;
    container.anchor.set(0, 0);
    container.zIndex = 2;
    container.position.set((this.game.dim.w - bg.width) / 2, 50);
    this.container.addChild(container);
    const showAnim = new Sequence([new Delay().setDuration(200), new FadeTo(1).setDuration(500), new Delay().setDuration(2000), new FadeTo(0).setDuration(500)]);
    addShadow(bg);
    scheduler.run(showAnim, container);
  }

  private getColorStyle(typ: Info): { borderColor: number; backgroundColor: number } {
    if (typ === Info.INFO)
      return {
        borderColor: 0x21528a,
        backgroundColor: 0xebf0fd,
      };
    else if (typ === Info.ERR)
      return {
        borderColor: 0xfd1313,
        backgroundColor: 0xfbe8e9,
      };
    return {
      borderColor: 0xde8b2a,
      backgroundColor: 0xfcf9e7,
    };
  }

  private switchInfoIcon(height: number, typ: Info, container: PIXI.Sprite) {
    let icon: PIXI.Sprite;
    switch (typ) {
      case Info.INFO:
        icon = new PIXI.Sprite(this.game.loader.resources[res.info].texture);
        break;
      case Info.WARN:
        icon = new PIXI.Sprite(this.game.loader.resources[res.warning].texture);
        break;
      case Info.ERR:
        icon = new PIXI.Sprite(this.game.loader.resources[res.error].texture);
        break;
    }
    icon.scale.set(height / icon.height);
    icon.anchor.set(0, 0.5);
    icon.position.set(15, container.getBounds().height / 2);
    container.addChild(icon);
  }

  private setShowAnimTime(duration: number) {
    this.showAnim = new Sequence([new Delay().setDuration(200), new FadeTo(1).setDuration(500), new Delay().setDuration(duration), new FadeTo(0).setDuration(500)]);
  }

  destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
    this.bg.removeAllListeners();
    this.skip.removeAllListeners();
    super.destroy(options);
  }
}

export enum Info {
  INFO,
  WARN,
  ERR,
}

export function addShadow(graphics: PIXI.Container) {
  let dropShadowFilter = new DropShadowFilter();
  dropShadowFilter.color = 0x000000;
  dropShadowFilter.alpha = 0.6;
  dropShadowFilter.distance = 3;

  graphics.filters = [dropShadowFilter];
}

class Timer extends PIXI.Sprite {
  private mSeconds: number;
  private recentMSeconds: number;
  private circle: PIXI.Graphics;
  private numberText: PIXI.Text;
  private radius: number;
  private interval: Process = null;

  private get inSeconds() {
    return Math.round(this.recentMSeconds / 1000);
  }

  constructor() {
    super();
    this.circle = new PIXI.Graphics();
    this.numberText = new PIXI.Text('', {
      fontFamily: styleSheet.fontFamily,
      fontSize: 40,
      fill: 0x2b7371,
      fontWeight: 'bold',
    });
    this.numberText.anchor.set(0.5);
    this.addChild(this.circle);
    this.addChild(this.numberText);
    this.anchor.set(0.5);
  }

  public start(seconds: number) {
    this.mSeconds = seconds * 1000;
    this.recentMSeconds = this.mSeconds;
    this.numberText.text = ''.padStart(this.inSeconds.toString().length, '9');
    this.radius = Math.sqrt(Math.pow(this.numberText.getBounds().width, 2) + Math.pow(this.numberText.getBounds().height, 2)) / 2;

    const ts = 25;
    this.interval = scheduler.setInterval(ts, () => {
      this.recentMSeconds = Math.max(0, this.recentMSeconds - ts);
      this.redraw();
      if (this.recentMSeconds === 0) this.stop();
    });

    this.redraw();
  }

  public stop() {
    scheduler.clearInterval(this.interval);
    this.interval = null;
  }

  private redraw() {
    this.numberText.text = this.inSeconds.toString();
    this.circle.clear();
    this.circle.lineStyle(3, 0x2b7371);
    this.circle.arc(0, 0, this.radius * 1.8, -Math.PI / 2, -Math.PI / 2 + (this.recentMSeconds / this.mSeconds) * 2 * Math.PI);
  }
}
