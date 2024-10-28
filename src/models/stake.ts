import { GameManager } from "./game-manager";
import { Player } from "./player";

export abstract class Stake{
    private gameManager: GameManager;
    private players: Player[]=[];
    constructor(gameManager: GameManager){
        this.gameManager=gameManager;
    }

    public Bet(amount: number): void{}
    public Call(): void{}
    public Raise(amount: number): void {}
    public Fold(): void {}
}