"use strict";

import { input } from "../lib/input.js";
import { config } from "../lib/config.js";
import { plane_t, vec2_t } from "../lib/math.js";
import { draw } from "../lib/draw.js";

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
  const d_2 = Math.min(1.0 / vec2_t.dot(pos, pos), 0.5);
  return vec2_t.mulf(pos, d_2);
}

function A(pos)
{
  // return new vec2_t(-pos.y, pos.x);
  return vec2_t.mulf(pos, 2.0 / vec2_t.dot(pos, pos));
}

export class scene_wave_t {
  width;
  height;
  H_field;
  E_field;
  wave_canvas;
  prev_pos;
  t;
  
  load()
  {
    this.wave_canvas = document.getElementById("wave").getContext("2d");
    this.width = 50;
    this.height = 50;
    this.H_field = [];
    this.E_field = [];
    this.t = 0;
    this.prev_pos = null;
    
    for (let y = 0; y < this.height; y++) {
      this.E_field[y] = [];
      this.H_field[y] = [];
      
      for (let x = 0; x < this.width; x++) {
        this.E_field[y][x] = new vec2_t();
        this.H_field[y][x] = 0.0;
      }
    }
    
    this.wave_canvas.beginPath();
    this.wave_canvas.moveTo(0, this.wave_canvas.canvas.height / 2);
    this.wave_canvas.lineTo(this.wave_canvas.canvas.width, this.wave_canvas.canvas.height / 2);
    this.wave_canvas.stroke();
  }
  
  vector_field()
  {
    draw.clear();
    for (let y = -this.height / 2; y < this.height / 2; y++) {
      for (let x = -this.width / 2; x < this.width / 2; x++) {
        const pos = new vec2_t(x, y);
        const A_pos = A(pos);
        
        const dx = new vec2_t(1.0, 0);
        const dy = new vec2_t(0, 1.0);
        
        const dA_dx = vec2_t.sub(A(vec2_t.add(pos, dx)), A(vec2_t.sub(pos, dx)));
        const dA_dy = vec2_t.sub(A(vec2_t.add(pos, dy)), A(vec2_t.sub(pos, dy)));
        
        const curl_A = dA_dx.y / dx.x - dA_dy.x / dy.y;
        
        const v_A = vec2_t.normalize(A_pos);
        const l_A = Math.min(4 * vec2_t.length(A_pos), 1.0);
        
        const l_DxA = Math.min(10 * Math.abs(curl_A), 0.5);
        
        draw.color((vec2_t.length(A_pos) + 0.5) * 200, 0, 0);
        
        draw.circle(pos, l_DxA);
        
        draw.circle(pos, 0.1);
        draw.line(pos, vec2_t.add(pos, vec2_t.mulf(v_A, l_A)));
      }
    }
  }
  
  frame()
  {
    draw.clear();
    
    this.radio();
    // this.curl();
    
    this.H_field_update();
    this.E_field_update();
    
    this.render();
    
    this.t += config.TIMESTEP;
  }
  
  curl()
  {
    if (input.get_mouse_button()) {
      draw.circle(input.get_mouse_pos(), 0.5);
      this.graph(input.get_mouse_pos());
    }
    
    const t = this.t * (input.get_mouse_button() ? 4.0 : 0.0);
    
    for (let i = 0; i < 1; i++) {
      const theta = 0;
      const x = i + 4 + Math.cos(t) * 4;
      const p = vec2_t.rotate(new vec2_t(0.0, x), theta);
      const dp = new vec2_t(0, -Math.sin(t) * 5);
      
      this.emit(p, -0.5, dp);
      draw.circle(p, 0.5);
    }
    
    /*
    const n = 5;
    for (let i = 0; i < n; i++) {
      const theta = t + i * 2 * Math.PI / n;
      const p = vec2_t.rotate(new vec2_t(0, 5), theta);
      
      this.emit(p, -0.5);
      draw.circle(p, 0.5);
    }*/
  }
  
  radio()
  {
    let frequency = 30;
    let amplitude = 1;
    if (input.get_mouse_button()) {
      frequency = 35;
    }
    
    const p = new vec2_t(-10.5, 0);
    
    const phase = Math.cos(this.t * frequency) * 4;
    const p1 = vec2_t.add(p, new vec2_t(0, +phase));
    const p2 = vec2_t.add(p, new vec2_t(0, -phase));
    
    this.emit(p1, -2.0 * amplitude);
    this.emit(p2, +2.0 * amplitude);
    
    draw.circle(p1, 0.5);
    draw.circle(p2, 0.5);
    
    const recv_pos = new vec2_t(10, 0);
    this.graph(recv_pos);
    draw.circle(recv_pos, 0.5);
  }
  
  graph(pos)
  {
    const value = this.H_at(pos);
    
    const speed = 160;
    const x_plot = (this.t * speed) % this.wave_canvas.canvas.width;
    const y_plot = this.wave_canvas.canvas.height / 2 + value * 800;
    
    if (this.prev_pos) {
      const dy1 = this.prev_pos.y - this.wave_canvas.canvas.height / 2;
      const dy2 = y_plot - this.wave_canvas.canvas.height / 2;
      
      if (dy1 < 0 && dy2 > 1 || dy1 > 0 && dy2 < 0)
        this.wave_canvas.fillRect(x_plot - 3, this.wave_canvas.canvas.height / 2, 3, 3);
      
      this.wave_canvas.beginPath();
      this.wave_canvas.moveTo(this.prev_pos.x, this.prev_pos.y);
      this.wave_canvas.lineTo(x_plot, y_plot);
      this.wave_canvas.stroke();
    }
    
    this.prev_pos = new vec2_t(x_plot, y_plot);
    
    if (x_plot + speed * config.TIMESTEP > this.wave_canvas.canvas.width) {
      this.wave_canvas.clearRect(0, 0, this.wave_canvas.canvas.width, this.wave_canvas.canvas.height);
      this.wave_canvas.beginPath();
      this.wave_canvas.moveTo(0, this.wave_canvas.canvas.height / 2);
      this.wave_canvas.lineTo(this.wave_canvas.canvas.width, this.wave_canvas.canvas.height / 2);
      this.wave_canvas.stroke();
      this.prev_pos.x = 0;
    }
  }
    
  render()
  {
    for (let y = -this.height / 2; y < this.height / 2; y++) {
      for (let x = -this.width / 2; x < this.width / 2; x++) {
        const pos = new vec2_t(x, y);
        
        const E_pos = this.E_at(pos);
        const H_pos = this.H_at(pos);
        
        const len_E = Math.min(1.0 * vec2_t.length(E_pos), 1.0);
        const dir_E = vec2_t.mulf(vec2_t.normalize(E_pos), len_E);
        
        const len_H = 0.1 + Math.min(1.0 * Math.abs(H_pos), 0.5);
        
        if (H_pos < 0)
          draw.color(0, 0, len_H * 255 + 255 / 2);
        else
          draw.color(len_H * 255 * 2 + 255 / 2, 0, 0);
        draw.circle(pos, len_H);

        draw.color(0, 0, 0);
        draw.line(pos, vec2_t.add(pos, dir_E));
      }
    }
  }
  
  emit(pos, charge, vel)
  {
    const xd = pos.x - Math.floor(pos.x);
    const yd = pos.y - Math.floor(pos.y);
    
    const d = 3;
    
    for (let y = -d; y <= d; y++) {
      for (let x = -d; x <= d; x++) {
        let xp = Math.floor(pos.x + x) + this.width / 2;
        let yp = Math.floor(pos.y + y) + this.height / 2;
        
        if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
          continue;
        
        this.E_field[yp][xp] = vec2_t.add(this.E_field[yp][xp], vec2_t.mulf(E(new vec2_t(x - xd, y - yd)), charge));
      }
    }
  }
  
  H_field_update()
  {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pos = new vec2_t(x - this.width / 2, y - this.height / 2);
        const curl = this.curl_E_at(pos);
        
        this.H_field[y][x] += -curl * config.TIMESTEP * 60.0;
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
        const J = vec2_t.mulf(this.E_field[y][x], 0.1);
        
        const dE = vec2_t.sub(curl_H, J);
        
        this.E_field[y][x] = vec2_t.add(this.E_field[y][x], vec2_t.mulf(dE, 45.0 * config.TIMESTEP));
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
    const p = new vec2_t(Math.floor(pos.x), Math.floor(pos.y));
    
    const d = 2.0;
    const d2 = d / 2.0;
    
    const dx_2 = vec2_t.add(pos, new vec2_t(+d2, 0));
    const dx_1 = vec2_t.add(pos, new vec2_t(-d2, 0));
    
    const dy_2 = vec2_t.add(pos, new vec2_t(0, +d2));
    const dy_1 = vec2_t.add(pos, new vec2_t(0, -d2));
    
    const dE_dx = vec2_t.sub(this.E_at(dx_2), this.E_at(dx_1));
    const dE_dy = vec2_t.sub(this.E_at(dy_2), this.E_at(dy_1));
    
    return dE_dx.y / d - dE_dy.x / d;
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
    const p = new vec2_t(Math.floor(pos.x), Math.floor(pos.y));
    
    const dx_1 = vec2_t.add(p, new vec2_t(-1, 0));
    const dx_2 = vec2_t.add(p, new vec2_t(+1, 0));
    
    const dy_1 = vec2_t.add(p, new vec2_t(0, -1));
    const dy_2 = vec2_t.add(p, new vec2_t(0, +1));
    
    const dHz_dx = this.H_at(dx_2) - this.H_at(dx_1);
    const dHz_dy = this.H_at(dy_2) - this.H_at(dy_1);
    
    return new vec2_t(dHz_dy / 2.0, -dHz_dx / 2.0);
  }
}

function main()
{
  const scene_wave = new scene_wave_t();
  
  scene_wave.load();
  
  setInterval(function() {
    scene_wave.frame();
  }, config.TICKRATE);
}

main();
