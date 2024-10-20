export class PokerSquaresLog {
  nofSteps = 0;
  nofUndos = 0;
  cardsLeftAtEnd = 0;
  rounds: Round[] = [];

  nextRound() {
    this.rounds.push(new Round());
  }
  setMistakes(mistakes: number) {
    if (this.rounds.length > 0) this.rounds[this.rounds.length - 1].nofMistakes = mistakes;
  }

  setPlayTime(pt: number) {
    if (this.rounds.length > 0) this.rounds[this.rounds.length - 1].playTime = pt;
  }
  setScore(score: number) {
    if (this.rounds.length > 0) this.rounds[this.rounds.length - 1].britishScore = score;
  }
}
export class Round {
  britishScore: number = 0;
  nofMistakes: number = 0;
  playTime: number = 0;
}
