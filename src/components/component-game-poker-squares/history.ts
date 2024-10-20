import { PokerSquaresLog } from '../../models/game-models/poker-squares-log';
import { Card } from './card';
import { ISlot } from './slot';

export class History {
  private static stack: IHistoryData[];
  private static enabled: boolean = true;

  public static Init() {
    this.stack = [];
  }

  public static Add(data: IHistoryData) {
    if (this.enabled) this.stack.push(data);
  }

  public static Undo(specificLog: PokerSquaresLog) {
    this.enabled = false;
    const data = this.stack.pop();
    if (data) {
      if (data.cardRevealed) data.cardRevealed.displayed = false;
      data.from.addCard(data.cards);
      specificLog.nofUndos++;
    }
    this.enabled = true;
  }
}

export interface IHistoryData {
  cards: Card[];
  from: ISlot;
  cardRevealed?: Card;
}
