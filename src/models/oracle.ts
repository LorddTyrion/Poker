export class Oracle{

     constructor(){
        
     }
    public SuggestMove(): number{
        let rand = Math.floor(Math.random() * 4);
        return rand;
    }
}