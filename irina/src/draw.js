"use strict";

import { vec2_t } from "./math.js";

export class draw_t {
  constructor(canvas)
  {
    this.inverse_fov = 20;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }
  
  color(new_color)
  {
    this.ctx.strokeStyle = new_color;
  }
  
  clear()
  {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  screen_space(v)
  {
    return new vec2_t(v.x * this.inverse_fov + this.canvas.width / 2, -v.y * this.inverse_fov + this.canvas.height / 2);
  }
  
  line(a, b)
  {
    const screen_a = this.screen_space(a);
    const screen_b = this.screen_space(b);
    
    this.ctx.beginPath();
    this.ctx.moveTo(screen_a.x, screen_a.y);
    this.ctx.lineTo(screen_b.x, screen_b.y);
    this.ctx.stroke();
    this.ctx.closePath();
  }
  
  circle(pos, radius)
  {
    const screen_pos = this.screen_space(pos);
    this.ctx.beginPath();
    this.ctx.arc(screen_pos.x, screen_pos.y, radius * this.inverse_fov, 0, 2 * Math.PI);
    this.ctx.stroke();
  }
};
