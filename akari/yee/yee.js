"use strict";

import { config } from "../lib/config.js";
import { input } from "../lib/input.js";
import { draw } from "../lib/draw.js";
import { field_t } from "./field.js";
import { vec2_t } from "../lib/math.js";

function main()
{
  const field = new field_t(120, 120);
  
  let t = 0;
  let next_H = 0;
  
  let code = "";
  
  document.getElementById("run").onclick = function() {
    try {
      code = document.getElementById("code").value;
      eval(code);
    } catch(e) {
      alert(e);
      code = "";
    }
  };
  
  setInterval(function() {
    draw.clear();
    const H_size = document.getElementById("H_size").value / 10.0;
    const H_rate = document.getElementById("H_rate").value / 1000.0;
    
    const cell_e = document.getElementById("cell_e").value / 100.0;
    const cell_u = document.getElementById("cell_u").value / 100.0;
    const cell_o = document.getElementById("cell_o").value / 100.0;
    
    if (code != "")
      eval(code);
    
    if (input.get_mouse_button()) {
      switch (document.getElementById("brush").value) {
      case "burst":
        if (t > next_H) {
          field.emit1(input.get_mouse_pos(), H_size);
          next_H = t + H_rate;
        }
        break;
      case "wall":
        field.set_cell(input.get_mouse_pos(), cell_e, cell_u, cell_o);
        break;
      case "eraser":
        field.set_cell(input.get_mouse_pos(), 1.0, 1.0, 0.4);
        break;
      }
    }
    
    field.update();
    field.draw();
    
    t += config.TIMESTEP;
  }, config.TICKRATE);
}

/*
--- circuit ---
const n = 2;

for (let i = 0; i < n; i++) {
  const period = 0.5;
  const theta = period * t * 2 * Math.PI + (i / n) * 2 * Math.PI;
  const r = 4;
  
  const p = vec2_t.rotate(new vec2_t(0, r), theta);
  const speed = 2 * Math.PI * r * period;
  const dp = vec2_t.mulf(vec2_t.cross_up(p), speed);
  
  field.emit_move(p, dp, -0.05);
  
  draw.color(255, 255, 255);
  draw.circle(p, 0.25);
}

--- dipole ---
const h = 2;
const period = 32;
    
const p = new vec2_t(9, Math.sin(t * period) * h);
const p1 = new vec2_t(9, -Math.sin(t * period) * h);
    
const dp = new vec2_t(0, Math.cos(t * period) * h * period);
    
const charge = 0.1;
    
field.emit_move(p, dp, -charge);
field.emit_move(p1, vec2_t.mulf(dp, -1), charge);
    
draw.color(255, 255, 255);
draw.circle(p, 0.25);
draw.circle(p1, 0.25);
*/

main();
