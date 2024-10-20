import { Card, Symbol } from './card';
import { History } from './history';
import { ICardMoveInfo, Slot } from './slot';
import { Deck } from './deck';
import { ShowSlot } from './showSlot';
import { PokerRow } from './poker-row';
import * as PIXI from 'pixi.js';
import { IGame } from './poker-squares-init';
import { translate } from '../../utils/translations.utils';
import styleSheet from '../../assets/font.json';
import { logError } from '../../models/log';

export class Map extends PIXI.Container {
  private columns: Slot[] = [];
  private rows: PokerRow[] = [];
  private texts: PIXI.Text[] = [];
  private mistakes: number = 0;
  private britishScore: number = 0;
  private deckSlot: Deck;
  private showSlot: ShowSlot;
  private moveInfo: ICardMoveInfo;
  private bg: PIXI.Graphics;
  private difficulty: number = 1;
  private slotContainer: PIXI.Container;
  private static canMoveCard: boolean = true;

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

    this.difficulty = settings.difficulty;

    this.slotContainer = new PIXI.Container();
    this.addChild(this.slotContainer);

    History.Init();
    for (let i = 0; i < 10; i++) {
      const newRow = new PokerRow(this, i);
      this.rows.push(newRow);
    }

    const offset = 300;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const newSlot = new Slot(this, this.rows[i], this.rows[5 + j], i * 5 + j);
        const padding = newSlot.getBounds().width * 0.1;
        newSlot.position.set(offset + i * (newSlot.getBounds().width + padding), j * (newSlot.getBounds().height + padding));
        this.slotContainer.addChild(newSlot);
        this.columns.push(newSlot);
      }
    }

    this.showSlot = new ShowSlot(this);
    this.deckSlot = new Deck(this.showSlot);
    this.deckSlot.position.set(this.deckSlot.getBounds().width * 0.1, (this.slotContainer.getBounds().height - this.deckSlot.getBounds().height) / 2);
    this.slotContainer.addChild(this.deckSlot);
    this.showSlot.position.set(
      this.deckSlot.getBounds().right + this.showSlot.getBounds().width * 0.1,
      (this.slotContainer.getBounds().height - this.showSlot.getBounds().height) / 2,
    );
    this.slotContainer.addChild(this.showSlot);

    this.slotContainer.scale.set(Math.min((this.game.dim.h * 0.9) / (this.slotContainer.getBounds().height + 154), this.game.dim.w / (this.slotContainer.getBounds().width + 154)));
    this.slotContainer.position.set((this.game.dim.w - this.slotContainer.getBounds().width) / 2, (this.game.dim.h - this.slotContainer.getBounds().height) / 2 - 25);

    this.game.specificLog.nextRound();

    this.generateDeal(this.difficulty);
  }

  @logError()
  private generateDeal(difficulty: number) {
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

    const assembleDeck = (difficulty: number) => {
      let poker = 0;
      let drill = 0;
      let iters = 0;
      let iter_size = 0;
      if (difficulty == 0) {
        poker = 3;
        drill = 2;
        iters = 6;
        iter_size = 4;
      } else if (difficulty == 1) {
        poker = 0;
        drill = 5;
        iters = 4;
        iter_size = 6;
      }
      let deck: { value: number; symbol: Symbol }[] = [];
      for (let i = 0; i < poker; i++) {
        let pokerVal = Math.floor(Math.random() * clubs.length);

        deck.push(clubs.splice(clubs.length - pokerVal - 1, 1)[0]);
        deck.push(hearts.splice(hearts.length - pokerVal - 1, 1)[0]);
        deck.push(spades.splice(spades.length - pokerVal - 1, 1)[0]);
        deck.push(diamonds.splice(diamonds.length - pokerVal - 1, 1)[0]);
      }
      for (let i = 0; i < drill; i++) {
        let drillVal = Math.floor(Math.random() * clubs.length);

        deck.push(clubs.splice(clubs.length - drillVal - 1, 1)[0]);
        deck.push(hearts.splice(hearts.length - drillVal - 1, 1)[0]);
        deck.push(spades.splice(spades.length - drillVal - 1, 1)[0]);
      }
      let rest = 25 - 4 * poker - 3 * drill;
      for (let i = 0; i < rest; i++) {
        deck.push(getCard(getRandomDeck()));
      }

      let deck_shuffled: { value: number; symbol: Symbol }[] = [];
      let used_indices: number[] = [];
      let selected_from_deck: number[] = [];
      for (let i = 0; i < 25; i++) {
        deck_shuffled.push({ value: 0, symbol: Symbol.club });
      }

      for (let i = 0; i < iters; i++) {
        let slot1 = Math.floor(Math.random() * iter_size);
        let slot2 = Math.floor(Math.random() * iter_size);
        while (slot1 == slot2) {
          slot2 = Math.floor(Math.random() * iter_size);
        }

        if (difficulty == 0) {
          if (i == iters - 1) {
            deck_shuffled[i * iter_size + slot1] = deck[2];
            deck_shuffled[i * iter_size + slot2] = deck[3];
            selected_from_deck.push(2);
            selected_from_deck.push(3);
          } else {
            deck_shuffled[i * iter_size + slot1] = deck[i * 4];
            deck_shuffled[i * iter_size + slot2] = deck[i * 4 + 1];
            selected_from_deck.push(i * 4);
            selected_from_deck.push(i * 4 + 1);
          }
        } else if (difficulty == 1) {
          deck_shuffled[i * iter_size + slot1] = deck[i * 3];
          deck_shuffled[i * iter_size + slot2] = deck[i * 3 + 1];
          selected_from_deck.push(i * 3);
          selected_from_deck.push(i * 3 + 1);
        }
        used_indices.push(i * iter_size + slot1);
        used_indices.push(i * iter_size + slot2);
      }
      let deck_remainder: { value: number; symbol: Symbol }[] = [];
      for (let i = 0; i < 25; i++) {
        if (!selected_from_deck.includes(i)) {
          deck_remainder.push(deck[i]);
        }
      }
      for (let i = 0; i < 25; i++) {
        if (!used_indices.includes(i)) {
          let rndCard = Math.floor(Math.random() * deck_remainder.length);
          deck_shuffled[i] = deck_remainder.splice(deck_remainder.length - rndCard - 1, 1)[0];
        }
      }

      return deck_shuffled;
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
    const deck1 = assembleDeck(difficulty);

    for (const _ of this.columns) {
      const temp = deck1.pop();
      const newCard = new Card(temp.symbol, temp.value, this.game.loader);
      newCard.zIndex = 1;
      this.deckSlot.addCard([newCard]);
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
        this.checkFinish();
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
  private messageFromScore(score: number): string {
    switch (score) {
      case 30:
        return translate('flush', this.game.custom_lang);
      case 16:
        return translate('poker', this.game.custom_lang);
      case 12:
        return translate('straight', this.game.custom_lang);
      case 10:
        return translate('full', this.game.custom_lang);
      case 6:
        return translate('drill', this.game.custom_lang);
      case 5:
        return translate('straight_flush', this.game.custom_lang);
      case 3:
        return translate('two_pairs', this.game.custom_lang);
      case 1:
        return translate('one_pair', this.game.custom_lang);
      default:
        return translate('nothing', this.game.custom_lang);
    }
  }

  @logError()
  public displayScore(row: PokerRow, score: number) {
    let idx = row.index;
    const text = new PIXI.Text(this.messageFromScore(score), { fontFamily: styleSheet.fontFamily, fontSize: 70 });
    text.scale.set((45 * text.text.split('\n').length) / text.getBounds().height);
    this.slotContainer.addChild(text);
    if (idx < 5) {
      let maxBottom = 0;
      for (const slot of row.slots) {
        maxBottom = Math.max(maxBottom, slot.y + 140);
      }
      text.anchor.set(1, 0.5);
      text.rotation = -Math.PI / 2;
      text.position.set(row.slots[0].x + 50, maxBottom + 100 * 0.1);
    } else {
      idx -= 5;
      let maxRight = 0;
      text.anchor.set(0, 0.5);
      for (const slot of row.slots) maxRight = Math.max(maxRight, slot.x + 100);
      text.position.set(maxRight + 100 * 0.1, row.slots[0].y + 140 / 2);
    }
    this.texts.push(text);
    this.britishScore += score;
  }

  public addCardToSlot(idx: number) {
    if (this.showSlot.cards.length == 0 || !Map.canMoveCard) return;
    Map.canMoveCard = false;
    const moveX = this.columns[idx].getBounds().x - this.showSlot.cards[0].getBounds().x;
    const moveY = this.columns[idx].getBounds().y - this.showSlot.cards[0].getBounds().y;
    this.showSlot.cards[0].moveBy(new PIXI.Point(moveX / this.slotContainer.scale.x, moveY / this.slotContainer.scale.y)).then(() => {
      this.showSlot.cards[0].position.set(0, 0);
      this.columns[idx].addCard([this.showSlot.cards[0]]);
      Map.canMoveCard = true;
      this.checkFinish();
    });
  }

  @logError()
  public checkForMistakes(card: Card, col: number, row: number, achieved: number) {
    for (let i = 0; i < this.rows.length; i++) {
      let rowCards: Card[] = [];
      for (const card of this.rows[i].cards) {
        rowCards.push(card);
      }
      if (rowCards.length != 4) continue;
      if (col == i || row == i - 5) continue;
      let prevScore = this.rows[i].calculateScore(rowCards);
      rowCards.push(card);
      let score = this.rows[i].calculateScore(rowCards);
      if (achieved >= score) continue;
      if (prevScore >= score && (prevScore == 16 || prevScore == 10 || prevScore == 6)) continue;
      if (score >= 5 && score <= 6) this.mistakes++;
      else if (score >= 10 && score <= 12) this.mistakes += 2;
      else if (score >= 16 && score <= 30) this.mistakes += 3;
    }
  }

  @logError()
  public checkFinish() {
    let ended = true;
    for (const row of this.rows) {
      if (row.cards.length < 5) {
        ended = false;
        break;
      }
    }
    if (ended) {
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

    return ended;
  }
}

export interface MapSettings {
  map: string[];
  difficulty: number;
}
