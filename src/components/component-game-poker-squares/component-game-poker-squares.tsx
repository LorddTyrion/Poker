import { Component, Prop, Event, EventEmitter, Method, h } from '@stencil/core';
import { User } from '../../models/user';
import { Controller } from './controller';
import { PokerSquaresLog } from '../../models/game-models/poker-squares-log';
import { ErrorLogger, IBaseErrorLog, IErrorLog, Log, Logger } from '../../models/log';
import { init, res, version } from './poker-squares-init';
import { ScoreCalculator } from '../../scoreCalculator';
import * as PIXI from 'pixi.js';
import config from './config.json';
import { Interruptable } from './game-panel';

@Component({
  tag: 'component-game-poker-squares',
  styleUrl: 'component-game-poker-squares.css',
  shadow: false,
})
export class ComponentGamePokerSquares implements Interruptable, ErrorLogger {

  @Prop() player_id: any;
  @Prop() education? : string;
  @Prop() sex? : number;
  @Prop() birth_year? : number;
  @Prop() region: number;
  @Prop() custom_lang?: ("hu" | "en") = "en";
  @Prop() difficulty: number = 2;
  @Prop() probe_mode: boolean = false;
  @Prop() enable_narration?: boolean = true;
  @Prop() disable_log: boolean = false;
  @Prop() token?: string;

  @Event() finish: any;
  @Event() componentLoaded: EventEmitter<void>;
  @Event() narrationChanged: EventEmitter<boolean>;
  @Event() gameError: EventEmitter<IErrorLog>;

  user: User;
  container: any;
  app!: PIXI.Application;
  loader = new PIXI.Loader;
  controller: Controller;
  dim: any;
  scores: any;
  specificLog: PokerSquaresLog;
  log: Log;
  pauseDate: any;
  //log and pauseDate comes from super
  startedOnce = false;
  stats = undefined;
  doNarration: boolean;

  logError(error: IBaseErrorLog): void {
    this.gameError.emit({
      game: "poker-squares",
      ...error
    });
  }

  timeout(): void {
    this.controller.timeout(() => {
      this.controller.stop();
      this.app.stage.removeChildren();
      this.log.timeout = true;
      this.log.interrupt();
      const duration = new Date().getTime() - new Date(this.log.start_time).getTime() - this.log.pause_time;
      this.stats = { duration: duration, score: 0, mentalScore: 0, log: this.log };
      this.sendMessage();
      this.cleanupUsedResources();
    });
  }

  public start() : void {
    this.user = new User(this.region, this.player_id, this.sex, this.education, this.birth_year)
    this.doNarration = this.enable_narration;

    Logger.initLogger(this);
  
    if(!this.startedOnce){
      
      window.addEventListener("resize", this.onResize);
      this.container = document.getElementById('game');
      
      this.dim = {
        w: this.container.offsetWidth,
        h: this.container.offsetHeight
      }

      this.app = new PIXI.Application({
        width: this.dim.w,
        height: this.dim.h,
        antialias: true,
        transparent: false,
        autoDensity: true,
        resolution: 2,
        backgroundColor: 0xfafafa
      });


      this.container.appendChild(this.app.view);
      this.componentLoaded.emit();
    }

    this.specificLog = new PokerSquaresLog();

    this.init();

    this.log = new Log(
      this.user,                    //user data (player_id, region, sex, education, birth_year)          
      "example",                    //game_name
      new Date().toISOString(),     //start_time
      "mobile",                     //mobile
      version,                      //game_version
      "unknown",                    //ui_agent
      this.dim.w,                   //ui_width
      this.dim.h);                  //ui_height
      this.startedOnce = true;
      this.log.difficulty = this.difficulty;
  }

  private init(){
    this.controller = new Controller(this);
    this.controller.start();

    this.app.stage.interactive = true;
    this.app.stage.interactiveChildren = true;
    this.app.stage.sortableChildren = true;
  }

  public changeNarration(value: boolean){
    this.doNarration = value;
    this.narrationChanged.emit(value);
  }

  private onResize = () =>
		{
			const container = this.app.view.parentElement;
			let screenWidth = container.clientWidth;
			let screenHeight = container.clientHeight;
			let tempWidth = this.dim.w;
			let tempHeight = this.dim.h;
			const ratio = this.dim.w / this.dim.h;

			if (screenWidth > tempWidth) {
				tempWidth = screenWidth;
				tempHeight = screenWidth / ratio;
			}
			if (screenHeight > tempHeight) {
				tempHeight = screenHeight;
				tempWidth = screenHeight * ratio;
			}
			if (tempWidth > screenWidth) {
				tempWidth = screenWidth;
				tempHeight = screenWidth / ratio;
			}
			if (tempHeight > screenHeight) {
				tempHeight = screenHeight;
				tempWidth = screenHeight * ratio;
			}

			this.app.renderer.view.style.width = tempWidth + "px";
			this.app.renderer.view.style.height = tempHeight + "px";
		}

  private fillLoader(){
    init(() => {
      Object.keys(res).forEach(key => {
        this.loader.add(res[key]);
      })
      this.loader.load(()=> this.start());
      }
        
    );
  }

  public calculateScore() {

    const displayedpercentages = [];
		const realPercentages = [];
		const goodValuesPerLevel = [];
		const valuesPerLevel = [];
		const acceptableValuesPerLevel = [];
		const weightsPerLevel = [];
    const mentalPercentages = [];
    const duration = this.controller.gamePanel.recentTime;

		// calculating scores for every level just in class planar
		// transforming the level specific scores into percentages
		// e.g.: 400 displayed score on level 0 is 50% (halfway to the maximum of 600 and the minimum of 200)
    for (let i = 0; i < this.specificLog.rounds.length; i++) {
			const goodValues = [];
			const values = [];
			const acceptableValues = [];
			const weights = [];
			
      //nofWrongCheck
      goodValues.push(config[i].mistakes.good);
      values.push(this.specificLog.rounds[i].nofMistakes);
      acceptableValues.push(config[i].mistakes.acceptable);
      weights.push(config[i].mistakes.weight);
      //playTime
      goodValues.push(config[i].playTime.good);
      values.push(this.specificLog.rounds[i].playTime / 1000);
      acceptableValues.push(config[i].playTime.acceptable);
      weights.push(config[i].playTime.weight);

      //100 - bristish score
      goodValues.push(config[i].britishScore.good);
      values.push(100-this.specificLog.rounds[i].britishScore);
      acceptableValues.push(config[i].britishScore.acceptable);
      weights.push(config[i].britishScore.weight);

			goodValuesPerLevel.push(goodValues);
			valuesPerLevel.push(values);
			acceptableValuesPerLevel.push(acceptableValues);
			weightsPerLevel.push(weights);

			const calculator = new ScoreCalculator(this.controller.maxRounds - 1, i);

			const localDisplayedScore = calculator.getDisplayedScore(goodValues, values, acceptableValues, weights);
			const localRealScore = calculator.getRealScore(goodValues, values, acceptableValues, weights);
      const localMfScore = calculator.getMFScore(goodValues, values, acceptableValues, weights);
			displayedpercentages.push((localDisplayedScore - 200) / (400 + i * 400));
			realPercentages.push((localRealScore) / (600 + i * 400));
      mentalPercentages.push((localMfScore-localRealScore/1000) / (((600 + i * 400 ) * 0.85) /10))
      //mf = (displayed * 0.85 + real/100) /10   ((400 + i * 200) * 0.85 + (600 + i * 200)/100) /10
		}
		let displayedScore = 1000 * (displayedpercentages.reduce((prev, curr) => prev + curr, 0) / this.controller.maxRounds);
		let realScore = 1000 * (realPercentages.reduce((prev, curr) => prev + curr, 0) / this.controller.maxRounds);
		let mentalScore = Math.round(85 * (mentalPercentages.reduce((prev, curr) => prev + curr, 0) / this.controller.maxRounds));
		displayedScore = Math.round(displayedScore);
		realScore = Math.round(realScore);
    this.log.mf_score = mentalScore;
		this.log.score = realScore;
    
    this.stats = { duration: duration, score: realScore, mentalScore: mentalScore, log: this.log };
    return mentalScore;
		/*const goodValues = [];
		const values = [];
		const acceptableValues = [];
		const weights = [];
    const diff = this.difficulty;

    goodValues.push(config[diff].playTime.good);
    values.push(0);
    acceptableValues.push(config[diff].playTime.acceptable);
    weights.push(config[diff].playTime.weight);

		const calculator = new ScoreCalculator(2, diff);
		const displayedScore = calculator.getDisplayedScore(goodValues, values, acceptableValues, weights);
		const realScore = calculator.getRealScore(goodValues, values, acceptableValues, weights);
    this.log.score = realScore;

    this.scores =  {
			displayed: displayedScore,
			real: realScore
		}
    let mF = calculator.getMFScore(goodValues, values, acceptableValues, weights);
    this.log.mf_score = mF;
    let duration = new Date().getTime() - new Date(this.log.start_time).getTime() - this.log.pause_time;
    this.stats = { duration: duration, score: realScore, mentalScore: mF, log: this.log };
    return mF;*/
	};

  sendMessage() {
    if (!this.stats) return;
    this.sendLog();
    this.finish.emit(this.stats);
  }

  @Method() async pause() {
    this.controller.pause();
    this.pauseDate = Date.now()
    this.log.pause_count++;

}

  @Method() async resume(){
    this.controller.resume();
    this.log.pause_time += Date.now() - this.pauseDate

  }
  @Method() async stop(){
    this.interrupt();
    this.dispose();
  }

  private async interrupt() {
    this.controller.stop();
    this.log.interrupt();
    this.sendLog();
  }

  @Method() async restart(){
    this.app.stage.removeChildren();
    this.interrupt()
        .then(() => this.cleanupUsedResources())
        .finally(() => this.componentDidRender());
  }

  dispose() {
    this.cleanupUsedResources();
    this.container.innerHTML = "";
    this.app.destroy();
    this.loader.destroy();
  }

  cleanupUsedResources = () => {
    
    for (let descriptor in this.loader.resources) {
      this.loader.resources[descriptor].texture.destroy(true);
      delete this.loader.resources[descriptor];
  
    }
    this.loader.reset();
  }


  sendLog(){
    this.log.probe_mode = this.probe_mode;
    if(this.probe_mode) this.log.interrupt();
    let duration = Date.now()-new Date(this.log.start_time).getTime() - this.log.pause_time;
    this.log.duration = duration;
    this.log.game_specific_data = JSON.stringify(this.specificLog);
    this.log.send(this.token);
  }

  componentDidRender(){    
    setTimeout(()=> 
    { 
      this.fillLoader()

    }, 20);
  }

  render() {
    return (
      <div id="game" class="game-content">
      </div>
    );
  }

}
