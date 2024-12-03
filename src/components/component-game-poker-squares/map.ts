import { Card, Symbol } from './card';
import {Chip} from './chip';
import { History } from './history';
import { ICardMoveInfo, Slot } from './slot';
import { Deck } from './deck';
import { ShowSlot } from './showSlot';
import { PokerRow } from './poker-row';
import * as PIXI from 'pixi.js';
import { IGame } from './poker-squares-init';
import { logError } from '../../models/log';
import { GameManager } from '../../models/game-manager';
import {Button} from './button';
import styleSheet from '../../assets/font.json';

export class Map extends PIXI.Container {
  private columns: Slot[] = [];
  private communitySlots: Slot[]=[];
  private rows: PokerRow[] = [];
  private mistakes: number = 0;
  private britishScore: number = 0;
  private winnerIndex: number=0;
  public deckSlot: Deck;
  private showSlot: ShowSlot;
  private moveInfo: ICardMoveInfo;
  private bg: PIXI.Graphics;
  private chips: Chip[]=[];
  private chipText1: PIXI.Text;
  private chipText2: PIXI.Text;
  private actionText1: PIXI.Text;
  private actionText2: PIXI.Text;
  private potText: PIXI.Text;
  public raiseButton: Button;
  public callButton: Button;
  public foldButton: Button;
  private static canMoveCard: boolean = true;
  public gameManager: GameManager;

  constructor(settings: MapSettings, headerHeight: number, private game: IGame, private onEnded: () => void) {
    super();
    Map.canMoveCard = true;
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0xaade87);
    this.bg.drawRect(0, -headerHeight, this.game.dim.w, this.game.dim.h + headerHeight);
    this.bg.endFill();
    this.bg.interactive = true;
    this.addChild(this.bg);
    this.sortableChildren = true;
    this.gameManager=new GameManager(this);

    //this.onEnded.apply(() => console.log("END"));
    
    this.raiseButton = new Button({ label: "Bet / Raise" }, this.game.loader);
    this.raiseButton.position.set((this.game.dim.w - this.raiseButton.getBounds().width) -100 ,(this.game.dim.h - this.raiseButton.getBounds().height)  - 100);
    this.addChild(this.raiseButton);

    this.callButton = new Button({ label: "Check / call" }, this.game.loader);
    this.callButton.position.set((this.game.dim.w - this.callButton.getBounds().width) -100 ,(this.game.dim.h - 2.2*this.callButton.getBounds().height)  - 100);
    this.addChild(this.callButton);

    this.foldButton = new Button({ label: "Fold" }, this.game.loader);
    this.foldButton.position.set((this.game.dim.w - this.foldButton.getBounds().width) -100 ,(this.game.dim.h - 3.3* this.foldButton.getBounds().height)  - 100);
    this.addChild(this.foldButton);
    
   
    


    History.Init();
    for (let i = 0; i < 10; i++) {
      const newRow = new PokerRow(this, i);
      this.rows.push(newRow);
    }

    const offset = 300;
   

    //Player 1
    const slot1 = new Slot(this, this.rows[0], this.rows[0], 1);
    const slot2 = new Slot(this, this.rows[0], this.rows[0], 2);
    const padding = slot1.getBounds().width * 0.1;
    slot1.position.set((this.game.dim.w - slot1.getBounds().width) / 2, (this.game.dim.h - slot1.getBounds().height)  - 100);
    slot2.position.set((this.game.dim.w - slot2.getBounds().width) / 2 + slot1.getBounds().width+padding, (this.game.dim.h - slot2.getBounds().height)  - 100);
    this.addChild(slot1);
    this.addChild(slot2);
    
    //Player 2
    const slot3 = new Slot(this, this.rows[0], this.rows[0], 3);
    const slot4 = new Slot(this, this.rows[0], this.rows[0], 4);
    slot3.position.set((this.game.dim.w - slot3.getBounds().width) / 2, slot3.getBounds().height  - 100);
    slot4.position.set((this.game.dim.w - slot4.getBounds().width) / 2 + slot3.getBounds().width+padding, slot4.getBounds().height -100)
    this.addChild(slot3);
    this.addChild(slot4);

    this.columns.push(slot1);
    this.columns.push(slot2);
    this.columns.push(slot3);
    this.columns.push(slot4);

    


    this.showSlot = new ShowSlot(this);
    this.deckSlot = new Deck(this, this.showSlot);
    this.deckSlot.position.set(this.deckSlot.getBounds().width * 0.1 + offset, (this.game.dim.h - this.deckSlot.getBounds().height) / 2);
    this.addChild(this.deckSlot);
    this.showSlot.position.set(
      this.deckSlot.getBounds().right + this.showSlot.getBounds().width * 0.1,
      (this.game.dim.h - this.showSlot.getBounds().height) / 2,
    );
    this.addChild(this.showSlot);

    const flopStart = (this.game.dim.w - slot1.getBounds().width) / 2 - 2*(slot1.getBounds().width+padding)
    for (let i=0; i<5; i++){
      let newSlot = new Slot(this, this.rows[0], this.rows[0], i+5);
      newSlot.position.set(flopStart+i*(slot1.getBounds().width+padding), (this.game.dim.h-newSlot.getBounds().height)/2);
      this.addChild(newSlot);
      this.deckSlot.flopSlots.push(newSlot);
      this.communitySlots.push(newSlot);
    }

    const style={
      fontFamily: styleSheet.fontFamily,
      fontSize: 30,
      wordWrap: true,
      wordWrapWidth: Math.min(this.game.dim.w * 0.8, 500),
      align: 'center',
    };

    const chipstart = this.deckSlot.getBounds().width * 0.1 + offset;
    const chip1= new Chip(this.game.loader);
    chip1.position.set(chipstart, (this.game.dim.h - slot1.getBounds().height)  - 100);
    this.chips.push(chip1);
    this.addChild(chip1);

    this.chipText1 = new PIXI.Text("", style);
    this.chipText1.position.set(chipstart + chip1.getBounds().width + 20, (this.game.dim.h - slot1.getBounds().height)  - 100);
    this.addChild(this.chipText1);

    const actionstart = chipstart + chip1.getBounds().width + offset;
    this.actionText1= new PIXI.Text("", style);
    this.actionText1.position.set(actionstart, (this.game.dim.h - slot1.getBounds().height)  - 100);
    this.addChild(this.actionText1);

    const chip2= new Chip(this.game.loader);
    chip2.position.set(chipstart, slot3.getBounds().height  - 100);
    this.chips.push(chip2);
    this.addChild(chip2);

    this.chipText2 = new PIXI.Text("", style);
    this.chipText2.position.set(chipstart + chip2.getBounds().width +20, slot3.getBounds().height  - 100);
    this.addChild(this.chipText2);

    this.actionText2 = new PIXI.Text("", style);
    this.actionText2.position.set(actionstart, slot3.getBounds().height  - 100);
    this.addChild(this.actionText2);

    this.potText = new PIXI.Text("Pot: 0", style);
    this.potText.position.set((this.game.dim.w - this.foldButton.getBounds().width -200),(this.game.dim.h - 4.4* this.foldButton.getBounds().height)  - 100);
    this.addChild(this.potText);

    this.game.specificLog.nextRound();

    this.generateDeal();
    let privateCards= this.getPrivateCards();
    this.gameManager.assignCards(privateCards);
  }

  @logError()
  private generateDeal() {
    const getRandomDeck = () => {
      let deck: { value: number; symbol: Symbol }[];
      do {
        const rand = Math.floor(Math.random() * 4);
        switch (rand) {
          case 0:
            deck = clubs;
            break;
          case 1:
            deck = hearts;
            break;
          case 2:
            deck = spades;
            break;
          default:
            deck = diamonds;
        }
      } while (deck.length === 0);
      return deck;
    };

    const getCard = (deck: { value: number; symbol: Symbol }[]) => {
      let depth = Math.floor(Math.random() * deck.length) + 1;
      if (depth > deck.length) depth = deck.length;
      return deck.splice(deck.length - depth, 1)[0];
    };

    

    const clubs: { value: number; symbol: Symbol }[] = [];
    const hearts: { value: number; symbol: Symbol }[] = [];
    const spades: { value: number; symbol: Symbol }[] = [];
    const diamonds: { value: number; symbol: Symbol }[] = [];
    for (let i = 1; i <= 13; i++) {
      const value = i;
      clubs.push({ value, symbol: Symbol.club });
      hearts.push({ value, symbol: Symbol.heart });
      spades.push({ value, symbol: Symbol.spade });
      diamonds.push({ value, symbol: Symbol.diamond });
    }
    
    for (let i=1; i<52; i++) {
      let deck=getRandomDeck();
      let card = getCard(deck);
      let newCard=new Card(card.symbol, card.value, this.game.loader);
      this.deckSlot.addCard([newCard]);
    }
    for(let i=0; i<this.columns.length; i++){
      this.columns[i].addCard([this.deckSlot.cards[0]]);
    }
  }

  public cardsMoved(moveInfo: ICardMoveInfo) {
    if (!this.moveInfo) {
      // something is still moving
      this.moveInfo = moveInfo;
      // move everything back to their original position
      for (const card of this.moveInfo.cards) {
        const prevHeight = card.getBounds().height;
        this.addChild(card);
        card.scale.set(prevHeight / card.getBounds().height);
      }
      this.bg.on('pointermove', this.onMouseMove, this);
      this.on('pointerup', this.onMouseUp);
      this.on('pointerupoutside', this.onMouseUp);
    }
  }

  private onMouseMove(e) {
    const pos = { x: e.data.global.x, y: e.data.global.y };
    for (const card of this.moveInfo.cards) {
      card.position.set(pos.x - card.getBounds().width / 2, pos.y - card.getBounds().height / 2);
    }
  }

  private onMouseUp = () => {
    this.bg.off('pointermove', this.onMouseMove, this);
    this.off('pointerup', this.onMouseUp);
    this.off('pointerupoutside', this.onMouseUp);
    const currPos = {
      x: this.moveInfo.cards[0].getBounds().x + this.moveInfo.cards[0].getBounds().width / 2,
      y: this.moveInfo.cards[0].getBounds().y + this.moveInfo.cards[0].getBounds().height / 2,
    };
    // trying to snap moving cards to a near available slot/swapslot/resultSlot

    for (const slot of [...this.columns]) {
      if (slot.acceptsCards(currPos) && this.moveInfo.cards[0]?.moveable) {
        // move everything back to their original position
        for (let i = 0; i < this.moveInfo.cards.length; i++) {
          const card = this.moveInfo.cards[i];
          card.position.set(this.moveInfo.origPos.x, this.moveInfo.origPos.y + i * this.moveInfo.distanceBetweenCards);
          card.scale.set(1);
          (card.slot as Slot).addChild(card);
        }
        slot.addCard(this.moveInfo.cards);
        this.moveInfo = null;
        return;
      }
    }

    // move everything back to their original position
    for (let i = 0; i < this.moveInfo.cards.length; i++) {
      const card = this.moveInfo.cards[i];
      card.position.set(this.moveInfo.origPos.x, this.moveInfo.origPos.y + i * this.moveInfo.distanceBetweenCards);
      card.scale.set(1);
      (card.slot as Slot).addChild(card);
    }
    this.moveInfo = null;
  };
  

  

  public addCardToSlot(idx: number) {
    if (this.showSlot.cards.length == 0 || !Map.canMoveCard) return;
    Map.canMoveCard = false;
    const moveX = this.columns[idx].getBounds().x - this.showSlot.cards[0].getBounds().x;
    const moveY = this.columns[idx].getBounds().y - this.showSlot.cards[0].getBounds().y;
    this.showSlot.cards[0].moveBy(new PIXI.Point(moveX / this.scale.x, moveY / this.scale.y)).then(() => {
      this.showSlot.cards[0].position.set(0, 0);
      this.columns[idx].addCard([this.showSlot.cards[0]]);
      Map.canMoveCard = true;
    });
  }

  public updateTexts(chipTexts: string[], potText: string){
    this.chipText1.text = chipTexts[0];
    this.chipText2.text = chipTexts[1];
    this.potText.text = "Pot: "+potText;
  }

  public updateActionTexts(index: number, action: string){
    if(index == 0){
      this.actionText1.text = action;
      this.actionText2.text = "";
    }
    else{
      this.actionText1.text = "";
      this.actionText2.text = action;
    }
  }

  public updateTurn(index: number){
    if(index == 0){
      this.actionText1.text = "Your turn!";
    }
    else{
      this.actionText2.text = "Opponent's turn!";
    }
  }

  
  public endGame(winner: number){
    this.winnerIndex=winner;
    this.interactive = false;
      this.interactiveChildren = false;
      setTimeout(() => {
        while (this.children.length > 1) {
          this.removeChildAt(this.children.length - 1);
        }

        this.game.specificLog.setMistakes(this.mistakes);
        this.game.specificLog.setScore(this.britishScore);
        this.onEnded();
      }, 1000);
    
  }
  public humanPlayerWon(): boolean{
    return this.winnerIndex==0;
  }

  public getCommunityCards(): Card[]{
    let communityCards=[];
    for(let i=0; i<this.communitySlots.length; i++){
      if(this.communitySlots[i].cards[0] == null) continue;
      communityCards.push(this.communitySlots[i].cards[0]);
    }
    return communityCards;
  }
  private getPrivateCards(): Card[]{
    let privateCards= [];
    for(let i=0; i<this.columns.length; i++){
      for(let j=0; j< this.columns[i].cards.length; j++){
        privateCards.push(this.columns[i].cards[j]);
      }
    }
    return privateCards;
  }
}



export interface MapSettings {
  map: string[];
  difficulty: number;
}
