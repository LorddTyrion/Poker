import * as PIXI from 'pixi.js';
import { res } from './poker-squares-init';

export class Button extends PIXI.NineSlicePlane {
    private settings = {
        // Default values
        width: 200,
        height: 100,

        fontSize: 35,
        label: 'Button',
        stroke: '#336699',
        strokeThickness: 4
    };
    private label: PIXI.Text;
    constructor(settings, loader: PIXI.Loader) {
        const texture: PIXI.Texture = loader.resources[res.button].texture.clone();
        const notScalableArea = 20 // Indent from left, top, right and bottom sides in pixels
        super(texture, notScalableArea, notScalableArea, notScalableArea, notScalableArea)


        this.interactive=true;
        this.buttonMode = true;
        this.on('pointertap', this.onClick)
        /** Contains settings for the button */
        

        // Main text on the button
        this.label = new PIXI.Text('')
        this.label.anchor.set(0.5)
        this.addChild(this.label)

        // Update visual appearance
        this.update(settings)
    }

    /** Updates the button's appearance after changing its settings */
    update(settings) {
        // Creating new settings which include old ones and apply new ones over it
        this.settings = {
            ...this.settings, // including old settings
            ...settings, // including new settings
        }

        this.label.text = this.settings.label
        this.label.style = {
            fontSize: this.settings.fontSize + 'px',
            fill: '#ffffff',
            stroke: this.settings.stroke,
            strokeThickness: this.settings.strokeThickness,
        }

        this.onResize()
    }

    /** Changes sizes and positions each time when the button updates */
    onResize() {
        this.width = this.settings.width
        this.height = this.settings.height

        this.label.x = this.width * 0.5
        this.label.y = this.height * 0.5

        this.pivot.set(this.width * 0.5, this.height * 0.5)
    }

    onClick(){
        console.log("Clicked");
    }

    addClickListener(fn: Function){
        this.off('pointertap', this.onClick);
        this.on('pointertap', fn);
    }
    resetClickListener(){
        this.off('pointertap');
        this.on('pointertap', this.onClick);
    }
}