import { res } from './poker-squares-init';
import { ISlot } from './slot';
import * as PIXI from 'pixi.js';

export class Chip extends PIXI.Container {
  public symbol: Symbol;
  public value: number; // A 2 3 4 5 6 7 8 9 10 J Q K, A = 1
  public slot: ISlot;


  
  private image: PIXI.Sprite;

  constructor(loader: PIXI.Loader) {
    super();
    const texture: PIXI.Texture = loader.resources[res.chip].texture.clone();


    this.image=new PIXI.Sprite(texture);
    this.image.scale.set(0.1, 0.1);
    
  
    this.addChild(this.image);


    this.interactive = true;
  }

}