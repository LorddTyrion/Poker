import { GameManager } from "./game-manager";
import { Player } from "./player";

export abstract class Stake{
    protected gameManager: GameManager;
    public players: Player[]=[];
    protected pot: number=0;
    public actions = ["", "", "", ""];
    public round = 0;
    constructor(gameManager: GameManager){
        this.gameManager=gameManager;
    }

    public addPlayers(players: Player[]){
        this.players=players;
    }
    public initializeRound(bigBets: boolean, round: number){}
    public collectStarterBets(){}

    public Bet(amount: number, player: Player): boolean{ return false;}
    public Call(player: Player): boolean{ return false;}
    public Raise(amount: number, player: Player):boolean{ return false;}
    public Fold(player: Player): boolean{ return false;}
    public Check(player: Player): boolean{ return false;}

    public RoundActive(): boolean{
        return false;
    }
    public GameActive():boolean{
        return true;
    }
}