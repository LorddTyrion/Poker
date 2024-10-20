import * as PIXI from 'pixi.js';
import styleSheet from '../../assets/font.json';

export class TryCounter extends PIXI.Container {
  private cntText: PIXI.Text;
  private radius: number;
  private circle: PIXI.Graphics;
  private maxTries: number;

  get value() {
    return this.remainedTries;
  }

  constructor(private remainedTries: number) {
    super();
    this.maxTries = remainedTries;
    this.cntText = new PIXI.Text(remainedTries.toString(), {
      fontFamily: styleSheet.fontFamily,
      fontSize: 40,
      fill: 0x2b7371,
      fontWeight: 'bold',
    });
    this.cntText.anchor.set(0.5, 0.5);
    this.addChild(this.cntText);
    this.radius = Math.max(this.cntText.width, this.cntText.height) / 2;
    this.drawStatusCircle();
  }

  public reduceTries() {
    this.cntText.text = (--this.remainedTries).toString();
    this.cntText.style.fill = this.interpolate(this.remainedTries / this.maxTries);
    this.drawStatusCircle();
  }

  public reset() {
    this.remainedTries = this.maxTries;
    this.cntText.text = this.remainedTries.toString();
    this.cntText.style.fill = this.interpolate(this.remainedTries / this.maxTries);
    this.drawStatusCircle();
  }

  private drawStatusCircle() {
    if (this.circle) this.removeChild(this.circle);
    this.circle = new PIXI.Graphics();
    this.circle.lineStyle(6, 0xdedede);
    this.circle.drawCircle(0, 0, this.radius * 1.8);
    this.circle.lineStyle(6, this.interpolate(this.remainedTries / this.maxTries));
    this.circle.arc(0, 0, this.radius * 1.8, -Math.PI / 2, -Math.PI / 2 + (this.remainedTries / this.maxTries) * 2 * Math.PI);
    this.addChild(this.circle);
  }

  private interpolate(alpha): number {
    const startColor = { r: 253, g: 19, b: 19 };
    const middleColor = { r: 222, g: 139, b: 42 };
    const endColor = { r: 43, g: 115, b: 113 };
    const start = alpha < 0.5 ? startColor : middleColor;
    const end = alpha < 0.5 ? middleColor : endColor;

    alpha = 2 * (alpha < 0.5 ? alpha : alpha - 0.5);

    const interplated = {
      r: Math.round(start.r + (end.r - start.r) * alpha),
      g: Math.round(start.g + (end.g - start.g) * alpha),
      b: Math.round(start.b + (end.b - start.b) * alpha),
    };
    return parseInt((interplated.r * 256 * 256 + interplated.g * 256 + interplated.b).toString(16), 16);
  }
}
