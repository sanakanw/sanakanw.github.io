"use strict";

const key_forward = "W".charCodeAt(0);
const key_left    = "A".charCodeAt(0);
const key_back    = "S".charCodeAt(0);
const key_right   = "D".charCodeAt(0);

export class client_t {
  constructor()
  {
    this.in_forward = false;
    this.in_left = false;
    this.in_back = false;
    this.in_right = false;
    this.in_mx = 0.0;
  }
  
  key_event(code, action)
  {
    switch (code) {
    case key_forward:
      this.in_forward = action;
      break;
    case key_left:
      this.in_left = action;
      break;
    case key_back:
      this.in_back = action;
      break;
    case key_right:
      this.in_right = action;
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
};
