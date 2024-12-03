import { res } from './poker-squares-init';
import * as PIXI from 'pixi.js';

export class Chip extends PIXI.Container {

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