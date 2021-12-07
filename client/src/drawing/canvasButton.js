import * as keys from '../keys';
import * as drawing from '../drawing';

export class CanvasButton {
  constructor(
    _gameStateRef, 
    _x, 
    _y, 
    _width, 
    _height, 
    _color, 
    _hoverColor, 
    _action, 
    _sprite = undefined, 
    _text = undefined, 
    _font = "30px Arial", 
    _textColor = "rgb(120, 120, 120)",
    _textColorHover = "rgb(255, 255, 255)"
  ) {
    this.gameStateRef = _gameStateRef;
    this.x = _x;
    this.y = _y;
    this.width = _width;
    this.height = _height;
    this.color = _color;
    this.hoverColor = _hoverColor;
    this.action = _action;
    this.text = _text;
    this.font = _font;
    this.textColor = _textColor;
    this.textColorHover = _textColorHover;
    this.sprite = _sprite;
  }
  
  updateAndDraw() {
    const c = this.gameStateRef.ctx;
    const mouse = keys.mouse();
    c.save();
    c.strokeStyle = this.color;
    c.fillStyle = this.hoverColor;
    if (mouse[0] > this.x && mouse[0] < this.x + this.width && mouse[1] > this.y && mouse[1] < this.y + this.height) {
      c.fillRect(this.x, this.y, this.width, this.height);
      if (this.sprite) {
        this.sprite.draw(this.gameStateRef, c, this.x + 4, this.y + 4, this.width - 4, this.height - 4);
      }
      if (this.text !== undefined) {
        drawing.drawText(this.text, this.x + this.width / 2, this.y + this.height / 2, this.font, this.textColorHover);
      }
      if (keys.pressed('mouseButton') && this.action !== undefined) {
        this.action();
      }
    } else {
      c.strokeRect(this.x, this.y, this.width, this.height);
      if (this.sprite) {
        this.sprite.draw(this.gameStateRef, c, this.x + 4, this.y + 4, this.width - 4, this.height - 4);
      }
      if (this.text !== undefined) {
        drawing.drawText(this.text, this.x + this.width / 2, this.y + this.height / 2, this.font, this.textColor);
      }
    }
    c.restore();
  }
}
