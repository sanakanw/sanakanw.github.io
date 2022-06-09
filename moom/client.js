"use strict";

const KEY_FORAWRD = "W".charCodeAt(0);
const KEY_LEFT    = "A".charCodeAt(0);
const KEY_BACK    = "S".charCodeAt(0);
const KEY_RIGHT   = "D".charCodeAt(0);

const MOUSE_ATTACK = 0;

export class client_t {
  constructor()
  {
    this.in_forward = 0;
    this.in_left = 0;
    this.in_back = 0;
    this.in_right = 0;
    this.in_attack = 0;
    this.in_mx = 0.0;
  }
  
  key_event(code, action)
  {
    switch (code) {
    case KEY_FORAWRD:
      this.in_forward = action;
      break;
    case KEY_LEFT:
      this.in_left = action;
      break;
    case KEY_BACK:
      this.in_back = action;
      break;
    case KEY_RIGHT:
      this.in_right = action;
      break;
    }
  }
  
  mouse_event(button, action)
  {
    switch (button) {
    case MOUSE_ATTACK:
      this.in_attack = action;
      break;
    }
  }
  
  mouse_move(dx, dy)
  {
    this.in_mx -= dx;
  }
  
  get_rot()
  {
    return this.in_mx;
  }
  
  get_forward()
  {
    return this.in_forward - this.in_back;
  }
  
  get_right()
  {
    return this.in_right - this.in_left;
  }
  
  get_attack()
  {
    return this.in_attack;
  }
};
