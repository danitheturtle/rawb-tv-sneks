import engine from 'engine';
import * as keys from '../keys';
import * as drawing from '../drawing';
const { utils } = engine;

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
    keys.keyUp("mouseButton", "touches", this.boundHandleClick);
  }
  
  handleClick(e) {
    let mouse = keys.mouse();
    if (mouse === undefined) {
      mouse = [e.clientX, e.clientY];
    }
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
    if (mouse && mouse[0] > this.x && mouse[0] < this.x + this.width && mouse[1] > this.y && mouse[1] < this.y + this.height) {
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
    keys.unbindKeyUp("mouseButton", "touches", this.boundHandleClick);
  }
}

export class CanvasTouchTarget {
  constructor(_x,_y,_width,_height,_color,_sprite,_touchStartCallback,_touchEndCallback,_touchMoveCallback) {
    this.x = _x;
    this.y = _y;
    this.width = _width;
    this.height = _height;
    this.color = _color;
    this.sprite = _sprite;
    this.touchStartCallback = _touchStartCallback;
    this.touchEndCallback = _touchEndCallback;
    this.touchMoveCallback = _touchMoveCallback;
    this.activeTouchIds = [];
  }
  
  handleTouchStart(_state, e) {
    const adjustedX = this.x < 0 ? _state.viewport.width + this.x : this.x;
    const adjustedY = this.y < 0 ? _state.viewport.height + this.y : this.y;
    if (e.clientX > adjustedX && e.clientX < adjustedX + this.width && e.clientY > adjustedY && e.clientY < adjustedY + this.height) {
      if (this.touchStartCallback) {
        this.touchStartCallback(e);
      }
      if (this.touchMoveCallback) {
        keys.touchMove(this.touchMoveCallback, e.identifier)
      }
      this.activeTouchIds.push(e.identifier);
    }
  }
  
  handleTouchEnd(e) {
    if (this.activeTouchIds.includes(e.identifier)) {
      if (this.touchEndCallback) {
        this.touchEndCallback(e);
      }
      this.activeTouchIds.splice(this.activeTouchIds.indexOf(e.identifier), 1);
    }
  }
  
  updateAndDraw(_state) {
    const s = _state;
    const c = s.ctx;
    c.save();
    if (this.activeTouchIds.length === 0) {
      c.globalAlpha = 0.6;
    } else {
      c.globalAlpha = 0.9;
    }
    const adjustedX = this.x < 0 ? s.viewport.width + this.x : this.x;
    const adjustedY = this.y < 0 ? s.viewport.height + this.y : this.y;
    if (this.color) {
      c.strokeStyle = this.color;
      c.lineWidth = 10;
      const centerX = adjustedX + this.width/2;
      const centerY = adjustedY + this.height/2;
      const radius = (this.width/2.0 + this.height/2.0)/2.0;
      c.beginPath();
      c.arc(centerX, centerY, radius, 0, 2*Math.PI, false);
      c.stroke();
      c.closePath();
    }
    if (this.sprite) {
      this.sprite.draw(s, adjustedX, adjustedY, this.width, this.height);
    }
    if (this.activeTouchIds.length > 0) {
      for (let i=0; i<this.activeTouchIds.length; i++) {
        const touchData = keys.touch(this.activeTouchIds[i]);
        const clampedX = utils.clamp(touchData.clientX, adjustedX, adjustedX + this.width);
        const clampedY = utils.clamp(touchData.clientY, adjustedY, adjustedY + this.height);
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(clampedX, clampedY, 16, 0, 2*Math.PI, false);
        c.fill();
        c.closePath();
      }
    }
    c.restore();
  }
}
