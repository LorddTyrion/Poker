import { Component, Prop, Event, EventEmitter, Method, h } from '@stencil/core';
import { User } from '../../models/user';
import { Controller } from './controller';
import { PokerSquaresLog } from '../../models/game-models/poker-squares-log';
import { ErrorLogger, IBaseErrorLog, IErrorLog, Log, Logger } from '../../models/log';
import { init, res, version } from './poker-squares-init';
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
