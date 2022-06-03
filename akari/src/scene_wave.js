"use strict";

import { input } from "./input.js";
import { config } from "./config.js";
import { plane_t, vec2_t } from "./math.js";
import { draw } from "./canvas.js";

class point_t {
  constructor(pos, charge, vel)
  {
    this.pos = pos;
    this.charge = charge;
    this.vel = vel;
  }
};

function E(pos)
{
  const d_2 = vec2_t.dot(pos, pos) + 0.01;
  return vec2_t.mulf(new vec2_t(pos.x / d_2, pos.y / d_2), 1.0);
}

export class scene_wave_t {
  width = 40;
  height = 40;

  H_field = [];
  E_field = [];

  points = [];
  planes = [];
  
  t = 0;
  
  load()
  {
    for (let y = 0; y < this.height; y++) {
      this.E_field[y] = [];
      this.H_field[y] = [];
      
      for (let x = 0; x < this.width; x++) {
        this.E_field[y][x] = new vec2_t();
        this.H_field[y][x] = 0.0;
      }
    }
  }
  
  frame()
  {
    if (input.get_mouse_button())
      this.emit(input.get_mouse_pos(), 1.0);
    
    this.t += config.TIMESTEP;
    
    this.emit(new vec2_t(0.0, +Math.cos(this.t * 1) * 4.0), -0.1);
    this.emit(new vec2_t(0.0, -Math.cos(this.t * 1) * 4.0), +0.1);
    
    this.H_field_update();
    this.E_field_update();
    
    this.render();
  }
    
  render()
  {
    draw.clear();
    
    for (let y = -this.height / 2; y < this.height / 2; y++) {
      for (let x = -this.width / 2; x < this.width / 2; x++) {
        const pos = new vec2_t(x, y);
        
        const E_pos = this.E_at(pos);
        const H_pos = this.H_at(pos);
        
        const len_E = Math.min(40.0 * vec2_t.length(E_pos), 1.0);
        const dir_E = vec2_t.mulf(vec2_t.normalize(E_pos), len_E);
        
        draw.circle(pos, 0.1 + Math.min(5.0 * Math.abs(H_pos), 0.5));
        draw.line(pos, vec2_t.add(pos, dir_E));
      }
    }
  }
  
  emit(pos, charge)
  {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const d = vec2_t.sub(new vec2_t(x - this.width / 2, y - this.height / 2), pos);
        this.E_field[y][x] = vec2_t.add(this.E_field[y][x], vec2_t.mulf(E(d), charge));
      }
    }
  }
  
  H_field_update()
  {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pos = new vec2_t(x - this.width / 2, y - this.height / 2);
        const curl = this.curl_E_at(pos);
        
        this.H_field[y][x] += -curl * config.TIMESTEP * 50.0;
      }
    }
  }
  
  E_field_update()
  {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pos = new vec2_t(x - this.width / 2, y - this.height / 2);
        
        const H_pos = this.H_at(pos);
        
        const curl_H = this.curl_H_at(pos);
        const J = vec2_t.mulf(this.E_field[y][x], 5.0);
        
        const dE = vec2_t.sub(curl_H, J);
        
        this.E_field[y][x] = vec2_t.add(this.E_field[y][x], vec2_t.mulf(dE, config.TIMESTEP));
      }
    }
  }
  
  E_at(pos)
  {
    let xp = Math.floor(pos.x) + this.width / 2;
    let yp = Math.floor(pos.y) + this.height / 2;
    
    if (xp < 0) xp = 0;
    if (yp < 0) yp = 0;
    if (xp >= this.width) xp = this.width - 1;
    if (yp >= this.height) yp = this.height - 1;
    
    return this.E_field[yp][xp];
  }

  curl_E_at(pos)
  {
    const dx_2 = vec2_t.add(pos, new vec2_t(+1, 0));
    const dx_1 = vec2_t.add(pos, new vec2_t(-1, 0));
    
    const dy_2 = vec2_t.add(pos, new vec2_t(0, +1));
    const dy_1 = vec2_t.add(pos, new vec2_t(0, -1));
    
    const dEy_dx = vec2_t.sub(this.E_at(dx_2), this.E_at(dx_1));
    const dEx_dy = vec2_t.sub(this.E_at(dy_2), this.E_at(dy_1));
    
    return dEy_dx.y / 2.0 - dEx_dy.x / 2.0;
  }

  H_at(pos)
  {
    let xp = Math.floor(pos.x) + this.width / 2;
    let yp = Math.floor(pos.y) + this.height / 2;
    
    if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
      return 0;
    
    return this.H_field[yp][xp];
  }

  curl_H_at(pos)
  {
    const dx_2 = vec2_t.add(pos, new vec2_t(1, 0));
    const dx_1 = vec2_t.add(pos, new vec2_t(-1, 0));
    
    const dy_2 = vec2_t.add(pos, new vec2_t(0, 1));
    const dy_1 = vec2_t.add(pos, new vec2_t(0, -1));
    
    const dHz_dx = this.H_at(dx_2) - this.H_at(dx_1);
    const dHz_dy = this.H_at(dy_2) - this.H_at(dy_1);
    
    return new vec2_t(dHz_dy / 2.0, -dHz_dx / 2.0);
  }
}
