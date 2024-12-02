import { scheduler } from '../../../anim';
import { parseParamTranslate, translate } from '../../utils/translations.utils';
import { IGame } from './poker-squares-init';
import { GamePanel } from './game-panel';
import { InfoManager } from './info-manager';
import { Map, MapSettings } from './map';
import * as PIXI from 'pixi.js';
import { Random } from './random';

export class Controller {
  private restartable: boolean = false;
  public readonly maxRounds: number = 1;
  private map: Map;
  public gamePanel: GamePanel;
  private infoMgr: InfoManager;
  private container: PIXI.Container;
  private difficulty: number = 0;
  private lastTs: number;

  constructor(private game: IGame) {
    this.container = new PIXI.Container();
    this.game.app.stage.addChild(this.container);
    this.gamePanel = new GamePanel(this.game, this.maxRounds);
    this.game.app.stage.addChild(this.gamePanel);
    this.infoMgr = new InfoManager(this.game, this.gamePanel, this.container);
    this.game.app.stage.addChild(this.infoMgr);
  }

  public start() {
    this.initRound();
  }
  public pause() {
    scheduler.pause();
    this.gamePanel.pauseTimer();
    this.game.app.stage.interactive = false;
    this.game.app.stage.interactiveChildren = false;
  }

  public resume() {
    scheduler.resume();
    this.gamePanel.resumeTimer();
    this.game.app.stage.interactive = true;
    this.game.app.stage.interactiveChildren = true;
  }

  public stop() {
    scheduler.stop();
    this.gamePanel.pauseTimer();
    this.game.app.stage.interactive = false;
    this.game.app.stage.interactiveChildren = false;
  }

  public restart() {
    if (!this.restartable) return;
    Random.resetPool();
    if (this.map) {
      this.removeMap();
      this.game.specificLog.rounds.pop();
    }
    this.initRound();
  }

  public timeout(callback: () => void) {
    this.infoMgr.showMsg(translate('timeout', this.game.custom_lang)).then(callback);
  }

  private dispose() {
    this.container.destroy({ children: true });
    this.gamePanel.destroy({ children: true });
    this.infoMgr.destroy({ children: true });
    this.game.dispose();
  }

  private initRound() {
    this.infoMgr.showMsg(parseParamTranslate('start_round', this.game.custom_lang, this.gamePanel.currRound + 1)).then(() => {
      this.lastTs = this.gamePanel.recentTime;
      let game = { ...this.game };
      game.dim = {
        w: game.dim.w,
        h: game.dim.h - this.gamePanel.height,
      };
      game.custom_lang = this.game.custom_lang;
      this.map = new Map(this.getSettings(this.difficulty), this.gamePanel.height, game, this.handleRoundEnd.bind(this));
      this.map.interactiveChildren = true;
      this.map.interactive = true;
      this.map.position.set(0, this.gamePanel.height);
      this.container.addChild(this.map);
      this.restartable = true;
    });
  }

  private handleRoundEnd() {
    this.restartable = false;
    this.game.specificLog.setPlayTime(this.gamePanel.recentTime - this.lastTs);
    if (this.gamePanel.isLastRound()) {
      let result= this.map.humanPlayerWon()? parseParamTranslate('win', this.game.custom_lang) : parseParamTranslate('lose', this.game.custom_lang);
      this.infoMgr.showMsg(parseParamTranslate('grat_for_all_success_round', this.game.custom_lang, result), false).then(() => {
        this.game.sendMessage();
        this.gamePanel.pauseTimer();
        this.game.app.stage.removeChildren();
        this.dispose();
      });
    } else {
      this.infoMgr.showMsg(parseParamTranslate('grat_for_success_round', this.game.custom_lang, this.gamePanel.currRound + 1)).then(() => {
        this.removeMap();
        this.gamePanel.nextRound();
        this.difficulty++;
        Random.newPool();
        this.initRound();
      });
    }
  }

  private removeMap() {
    if (!this.map) return;
    this.container.removeChild(this.map);
    this.map.destroy({ children: true });
  }

  private getSettings(difficulty: number) {
    const result: MapSettings = { map: [], difficulty: difficulty };
    return result;
  }
}
