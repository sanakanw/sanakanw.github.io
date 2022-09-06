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

const BOUND = 5;

const E_FREE_SPACE = 0.5;
const U_FREE_SPACE = 0.003;
const O_FREE_SPACE = 0.4;

export class field_t {
  width;
  height;
  cells;
  
  constructor(width, height)
  {
    this.width = width + 2 * BOUND;
    this.height = height + 2 * BOUND;
    
    this.cells = [];
    
    for (let y = 0; y < this.height; y++) {
      this.cells.push([]);
      
      for (let x = 0; x < this.width; x++) {
        if (x < BOUND || y < BOUND || x >= this.width - BOUND || y >= this.height - BOUND) {
          this.cells[y].push(
            new cell_t(
              new vec2_t(0.0, 0.0),
              0.0,
              E_FREE_SPACE,
              U_FREE_SPACE,
              O_FREE_SPACE * 10.0));
        } else {
          this.cells[y].push(
            new cell_t(
              new vec2_t(0.0, 0.0),
              0.0,
              E_FREE_SPACE,
              U_FREE_SPACE,
              O_FREE_SPACE));
        }
      }
    }
  }
  
  update()
  {
    this.update_H();
    this.update_E();
  }
  
  emit_H(x, y, charge)
  {
    const d = 1;
    
    for (let yp = y - d; yp <= y + d; yp++) {
      for (let xp = x - d; xp <= x + d; xp++) {
        if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
          continue;
        
        this.get_cell(xp, yp).H += charge * config.TIMESTEP;
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
        const xp = Math.floor(pos.x + x);
        const yp = Math.floor(pos.y + y);
        
        if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
          continue;
        
        const cell_pos = new vec2_t(x - xd, y - xd);
        
        const p_x = vec2_t.add(cell_pos, new vec2_t(0, -0.5));
        const p_y = vec2_t.add(cell_pos, new vec2_t(-0.5, 0));
        
        const dE_x = vec2_t.mulf(vel, 1.0 / vec2_t.dot(p_x, p_x));
        const dE_y = vec2_t.mulf(vel, 1.0 / vec2_t.dot(p_y, p_y));
        
        const dE = vec2_t.mulf(new vec2_t(dE_x.x, dE_y.y), charge * config.TIMESTEP);
        this.get_cell(xp, yp).E = vec2_t.add(this.get_cell(xp ,yp).E, dE);
      }
    }
  }
  
  set_cell(x, y, e, u, o)
  {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      return;
    
    this.get_cell(x, y).e = e;
    this.get_cell(x, y).u = u;
    this.get_cell(x, y).o = o;
  }
  
  update_H()
  {
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width - 1; x++) {
        const dEy_dx = this.cells[y][x].E.y - this.cells[y][x + 1].E.y;
        const dEx_dy = this.cells[y][x].E.x - this.cells[y + 1][x].E.x;
        
        const curl_E = dEy_dx - dEx_dy;
        
        const inverse_permeability = 1.0 / this.cells[y][x].u;
        
        this.cells[y][x].H -= inverse_permeability * curl_E * config.TIMESTEP;
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
        const J = vec2_t.mulf(this.cells[y][x].E, this.cells[y][x].o);
        
        const dE = vec2_t.sub(curl_H, J);
        
        const inverse_permittivity = 1.0 / this.cells[y][x].e;
        
        this.cells[y][x].E = vec2_t.add(this.cells[y][x].E, vec2_t.mulf(dE, inverse_permittivity * config.TIMESTEP));
      }
    }
  }
  
  get_cell(x, y)
  {
    return this.cells[y + BOUND][x + BOUND];
  }
  
  cell_rect(x, y, R, e, u, o)
  {
    for (let yp = y - R; yp < y + R; yp++) {
      for (let xp = x - R; xp < x + R; xp++) {
        if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
          continue;
        
        this.get_cell(xp, yp).e = e + E_FREE_SPACE;
        this.get_cell(xp, yp).u = u + U_FREE_SPACE;
        this.get_cell(xp, yp).o = o + O_FREE_SPACE;
      }
    }
  }
  
  clear_rect(x, y, R)
  {
    for (let yp = y - R; yp < y + R; yp++) {
      for (let xp = x - R; xp < x + R; xp++) {
        if (xp < 0 || yp < 0 || xp >= this.width || yp >= this.height)
          continue;
        
        this.get_cell(xp, yp).e = E_FREE_SPACE;
        this.get_cell(xp, yp).u = U_FREE_SPACE;
        this.get_cell(xp, yp).o = O_FREE_SPACE;
      }
    }
  }
  
  draw(display)
  {
    for (let y = 0; y < this.height - BOUND; y++) {
      for (let x = 0; x < this.width - BOUND; x++) {
        const H_value = Math.abs(this.get_cell(x, y).H) * 3;
        
        let r = Math.max((this.get_cell(x, y).e - E_FREE_SPACE) * 255, 0);
        let g = Math.max((this.get_cell(x, y).u - U_FREE_SPACE) * 255, 0);
        let b = Math.max((this.get_cell(x, y).o - O_FREE_SPACE) * 255, 0);
        
        
        if (this.get_cell(x, y).H > 0) {
          const H_col = HSVtoRGB(0.5, H_value / 7, H_value);
          r += H_col[0];
          g += H_col[1];
          b += H_col[2];
        }
        
        r = Math.min(r, 255);
        g = Math.min(g, 255);
        b = Math.min(b, 255);
        
        display.put_pixel_rgb([r, g, b], x, y);
      }
    }
  }
  
  get_width()
  {
    return this.width - 2 * BOUND;
  }
  
  get_height()
  {
    return this.height - 2 * BOUND;
  }
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    
    h = Math.min(h, 1);
    s = Math.min(s, 1);
    v = Math.min(v, 1);
    
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    
    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}
