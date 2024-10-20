import { PokerSquaresLog } from '../../models/game-models/poker-squares-log';

export const version = '1.0';
export interface IGame {
  app: PIXI.Application;
  loader: PIXI.Loader;
  dim: { readonly w: number; readonly h: number };
  specificLog: PokerSquaresLog;
  custom_lang?: 'hu' | 'en';
  doNarration: boolean;

  calculateScore(): number;
  sendMessage(): void;
  timeout(): void;
  dispose(): void;
  changeNarration(value: boolean): void;
}

export const res = {
  cards: './assets/poker-squares-res/img/release/cards.svg',
  undo: './assets/poker-squares-res/img/release/undo.svg',
  autoSolve: './assets/poker-squares-res/img/release/autoSolve.svg',
  hourglass: './assets/poker-squares-res/img/release/hourglass.svg',
  info: './assets/poker-squares-res/img/release/info.svg',
  warning: './assets/poker-squares-res/img/release/warning.svg',
  error: './assets/poker-squares-res/img/release/error.svg',
  chip: './assets/poker-squares-res/img/release/chip.svg',
  dealerBadge: './assets/poker-squares-res/img/release/dealer-badge.svg',
};

export function init(callback: () => void) {
  fetch('./assets/poker-squares-res/img/release/colors.json')
    .then(response => response.json())
    .then(_ => {
      callback();
    });
}
