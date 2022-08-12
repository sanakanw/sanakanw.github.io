"use strict";

import * as THREE from "three";

export class input_t {
  keys;
  invsere_fov;
  mouse_x;
  mouse_y;
  canvas;
  mouse_button;
  
  constructor(canvas)
  {
    this.keys = {};
    this.inverse_fov = 10;
    this.canvas = canvas;
    this.mouse_down = false;
    document.addEventListener("keydown", (e) => {
      this.keys[e.keyCode] = true;
    });
    document.addEventListener("keyup", (e) => {
      this.keys[e.keyCode] = false;
    });
  }
  
  get_key(key)
  {
    if (this.keys[key.charCodeAt(0)] == undefined)
      return false;
    
    return this.keys[key.charCodeAt(0)];
  }
};
