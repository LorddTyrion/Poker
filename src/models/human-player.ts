import { Player } from "./player";
import { Stake } from "./stake";
import { Map } from '../components/component-game-poker-squares/map';

type PlayerAction = 'fold' | 'call' | 'raise';
export class HumanPlayer extends Player{
    private timeoutSeconds: number;
    private map: Map;
    constructor(stake: Stake, index: number, map: Map, timeoutSeconds: number = 120){
        super(stake, index);
        this.timeoutSeconds = timeoutSeconds;
        this.map = map;
    }

    private async getUserInput(): Promise<PlayerAction> {
        return new Promise((resolve) => {
            const actionButtons = {
                fold: this.map.foldButton,
                call: this.map.callButton,
                raise: this.map.raiseButton,
            };

            const cleanup = () => {
                Object.values(actionButtons).forEach(button => {
                    if (button) {
                        button.resetClickListener();
                    }
                });
            };

            const handleClick = (action: PlayerAction) => {
                cleanup();
                resolve(action);
            };

            Object.entries(actionButtons).forEach(([action, button]) => {
                if (button) {
                    button.addClickListener(() => handleClick(action as PlayerAction));
                }
            });
        });
    }
    override async Step(): Promise<void> {        
        try {
            // Create a promise that rejects after the timeout
            const timeoutPromise = new Promise<PlayerAction>((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Timeout'));
                }, this.timeoutSeconds * 1000);
            });

            // Race between user input and timeout
            const result = await Promise.race([
                this.getUserInput(),
                timeoutPromise
            ]);
            switch(result){
                case "call":{
                    let success=this.stake.Check(this);
                    if(!success) success = this.stake.Call(this);
                    if(!success) this.stake.Fold(this); 
                    break;
                }
                case "fold":
                    this.stake.Fold(this); break;
                case "raise":{
                    let success= this.stake.Bet(1, this);
                    if(!success) success = this.stake.Raise(1, this);
                    if(!success) this.stake.Fold(this);
                    break;
                }
            }

        } catch (error) {
            console.log(`Time's up! Default action: fold`);
            this.stake.Fold(this);
        }
    }

}