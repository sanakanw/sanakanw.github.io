"use strict";

import { config } from "../lib/config.js";
import { vec2_t } from "../lib/math.js";
import { draw } from "../lib/draw.js";

class cell_t {
  E;
  H;
  mtl;
  
  constructor(E, H, e, u, o)
  {
    this.E = E;
    this.H = H;
    this.e = e;
    this.u = u;
    this.o = o;
  }
};

function E(pos)
{
  const inverse_dist_squared = 1.0 / Math.max(vec2_t.dot(pos, pos), 0.1);
  return vec2_t.mulf(pos, inverse_dist_squared);
}

export class field_t {
  width;
  height;
  cells;
  
  constructor(width, height)
  {
    this.width = width;
    this.height = height;
    
    this.cells = [];
    
    for (let y = 0; y < height; y++) {
      this.cells.push([]);
      
      for (let x = 0; x < width; x++) {
        if (Math.random() >= 0.0)
          this.cells[y].push(new cell_t(new vec2_t(0.0, 0.0), 0.0, 1.0, 1.0, 0.01));
      }
    }
  }
  
  update()
  {
    this.update_H();
    this.update_E();
  }
  
  emit1(pos, charge)
  {
    const xd = pos.x - Math.floor(pos.x);
    const yd = pos.y - Math.floor(pos.y);
    
    const d = 2;
    
    for (let y = -d; y <= d; y++) {
      for (let x = -d; x <= d; x++) {
        const xp = Math.floor(pos.x + x) + this.width / 2;
        const yp = Math.floor(pos.y + y) + this.height / 2;
        
        if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
          continue;
        
        const cell_pos = new vec2_t(x - xd, y - xd);
        
        this.cells[yp][xp].E = vec2_t.add(this.cells[yp][xp].E, E(cell_pos));
      }
    }
  }
  
  emit_move(pos, vel, charge)
  {
    const xd = pos.x - Math.floor(pos.x);
    const yd = pos.y - Math.floor(pos.y);
    
    const d = 2;
    
    for (let y = -d; y <= d; y++) {
      for (let x = -d; x <= d; x++) {
        const xp = Math.floor(pos.x + x) + this.width / 2;
        const yp = Math.floor(pos.y + y) + this.height / 2;
        
        if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
          continue;
        
        const cell_pos = new vec2_t(x - xd, y - xd);
        
        const p_x = vec2_t.add(cell_pos, new vec2_t(0, -0.5));
        const p_y = vec2_t.add(cell_pos, new vec2_t(-0.5, 0));
        
        const dE_x = vec2_t.mulf(vel, 1.0 / vec2_t.dot(p_x, p_x));
        const dE_y = vec2_t.mulf(vel, 1.0 / vec2_t.dot(p_y, p_y));
        
        const dE = vec2_t.mulf(new vec2_t(dE_x.x, dE_y.y), charge * config.TIMESTEP);
        
        this.cells[yp][xp].E = vec2_t.add(this.cells[yp][xp].E, dE);
      }
    }
  }
  
  emit_H(pos, charge)
  {
    const d = 1;
    
    for (let y = -d; y <= d; y++) {
      for (let x = -d; x <= d; x++) {
        const xp = Math.floor(pos.x + x) + this.width / 2;
        const yp = Math.floor(pos.y + y) + this.height / 2;
        
        if (xp < 1 || yp < 1 || xp >= this.width || yp >= this.height)
          continue;
        
        this.cells[yp][xp].H += charge * config.TIMESTEP;
      }
    }
  }
  
  set_cell(pos, e, u, o)
  {
    const xp = Math.floor(pos.x) + this.width / 2;
    const yp = Math.floor(pos.y) + this.height / 2;
    
    if (xp < 1 || yp < 1 || xp >= this.width || yp >= this.height)
      return;
    
    this.cells[yp][xp].e = e;
    this.cells[yp][xp].u = u;
    this.cells[yp][xp].o = o;
  }
  
  update_H()
  {
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const dEy_dx = this.cells[y][x].E.y - this.cells[y][x + 1].E.y;
        const dEx_dy = this.cells[y][x].E.x - this.cells[y + 1][x].E.x;
        
        const curl_E = dEy_dx - dEx_dy;
        
        const inverse_permeability = 1.0 / this.cells[y][x].u;
        
        this.cells[y][x].H -= 30 * inverse_permeability * curl_E * config.TIMESTEP;
      }
    }
  }
  
  update_E()
  {
    for (let y = 1; y < this.height; y++) {
      for (let x = 1; x < this.width; x++) {
        const dHz_dx = this.cells[y][x - 1].H - this.cells[y][x].H; 
        const dHz_dy = this.cells[y - 1][x].H - this.cells[y][x].H;
        
        const curl_H = new vec2_t(dHz_dy, -dHz_dx);
        const J = vec2_t.mulf(this.cells[y][x].E, 0.2 * this.cells[y][x].o);
        
        const dE = vec2_t.sub(curl_H, J);
        
        const inverse_permittivity = 1.0 / this.cells[y][x].e;
        
        this.cells[y][x].E = vec2_t.add(this.cells[y][x].E, vec2_t.mulf(dE, 30 * inverse_permittivity * config.TIMESTEP));
      }
    }
  }
  
  draw()
  {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pos = vec2_t.sub(new vec2_t(x, y), new vec2_t(this.width / 2, this.height / 2));
        const cell = this.cells[y][x];
        
        const len_H = Math.min(5 * Math.abs(cell.H), 0.25);
        const col_H = Math.min(Math.abs(cell.H) * 50000, 255);
        
        const len_E = Math.min(3 * Math.abs(vec2_t.length(cell.E)), 0.5);
        const vec_E = vec2_t.mulf(vec2_t.normalize(cell.E), len_E);
        
        if (len_H > 0.05) {
          if (cell.H < 0)
            draw.color(0, 0, col_H);
          else
            draw.color(col_H, 0, 0);
          draw.circle(pos, len_H);
        }
        
        if (len_E > 0.05) {
          draw.color(255, 255, 255);
          draw.line(pos, vec2_t.add(pos, vec_E));
        }
        
        const col_e = (cell.e - 1.0) / 4.0 * 255;
        const col_u = (cell.u - 1.0) / 4.0 * 255;
        const col_o = cell.o / 4.0 * 255;
        
        if (col_e > 10 || col_u > 10 || col_o > 10) {
          draw.color(col_e, col_u, col_o);
          draw.rect(vec2_t.sub(pos, new vec2_t(0.5, 0.5)), 1.0, 1.0);
        }
      }
    }
  }
}
