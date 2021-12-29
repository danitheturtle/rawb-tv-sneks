import * as keys from '../keys';
import * as drawing from '../drawing';

export class CanvasButton {
  constructor(
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
    this.boundHandleClick = this.handleClick.bind(this);
    keys.keyUp("mouseButton", this.boundHandleClick);
  }
  
  handleClick() {
    const mouse = keys.mouse();
    if (this.action !== undefined && mouse[0] > this.x && mouse[0] < this.x + this.width && mouse[1] > this.y && mouse[1] < this.y + this.height) {
      this.action();
    }
  }
  
  updateAndDraw(_state) {
    const s = _state;
    const c = s.ctx;
    const mouse = keys.mouse();
    c.save();
    c.strokeStyle = this.color;
    c.fillStyle = this.hoverColor;
    if (mouse[0] > this.x && mouse[0] < this.x + this.width && mouse[1] > this.y && mouse[1] < this.y + this.height) {
      c.fillRect(this.x, this.y, this.width, this.height);
      if (this.sprite) {
        this.sprite.draw(s, this.x + 4, this.y + 4, this.width - 4, this.height - 4);
      }
      if (this.text !== undefined) {
        drawing.drawText(s, this.text, this.x + this.width / 2, this.y + this.height / 2, this.font, this.textColorHover);
      }
    } else {
      c.strokeRect(this.x, this.y, this.width, this.height);
      if (this.sprite) {
        this.sprite.draw(s, this.x + 4, this.y + 4, this.width - 4, this.height - 4);
      }
      if (this.text !== undefined) {
        drawing.drawText(s, this.text, this.x + this.width / 2, this.y + this.height / 2, this.font, this.textColor);
      }
    }
    c.restore();
  }
  
  destroy() {
    keys.unbindKeyUp("mouseButton", this.boundHandleClick);
  }
}
