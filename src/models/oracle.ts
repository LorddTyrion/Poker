export class Oracle{

     constructor(){
        
     }
    public SuggestMove(): number{
        let rand = Math.floor(Math.random() * 100)+1;
        return rand;
    }
}