"use strict";

import { config } from "../lib/config.js";
import { field_t } from "./field.js";
import { vec2_t } from "../lib/math.js";
import { display_t } from "./display.js";
import { point_t } from "./point.js";

function main()
{
  const WIDTH = 100;
  const HEIGHT = 100;
  
  const field = new field_t(WIDTH, HEIGHT);
  const display = new display_t(WIDTH, HEIGHT);
  
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  
  let mouse_down = false;
  let cell_x = 0;
  let cell_y = 0;
  
  canvas.addEventListener("mousedown", function(e) {
    mouse_down = true;
  });
  
  canvas.addEventListener("mouseup", function(e) {
    mouse_down = false;
  });
  
  canvas.addEventListener("mousemove", function(e) {
    cell_x = Math.floor(e.offsetX * WIDTH / canvas.width);
    cell_y = Math.floor(e.offsetY * HEIGHT / canvas.height);
  });
  
  let time = 0.0;
  let next_H = 0.0;
  
  /*
  const points = [];
  
  for (let i = 0; i < 10; i++) {
    const pos = new vec2_t(40 + Math.random() * 5, 40 + Math.random() * 5);
    points.push(new point_t(pos, (i % 2) * 2 - 1));
  }*/
  
  setInterval(function() {
    const H_size = document.getElementById("H_size").value / 10.0;
    const H_rate = document.getElementById("H_rate").value / 1000.0;
    
    const cell_e = document.getElementById("cell_e").value / 10.0;
    const cell_u = document.getElementById("cell_u").value / 10.0;
    const cell_o = document.getElementById("cell_o").value / 10.0;
    
    const brush_R = Math.floor(document.getElementById("R_size").value / 2.0);
    
    // const solid = document.getElementById("solid").checked;
    const brush = document.getElementById("brush").value;
    
    if (mouse_down) {
      switch (brush) {
      case "wall":
        field.cell_rect(cell_x, cell_y, brush_R, cell_e, cell_u, cell_o, true);
        break;
      case "eraser":
        field.clear_rect(cell_x, cell_y, brush_R);
        break;
      case "burst":
        if (time > next_H) {
          field.emit_H(cell_x, cell_y, brush_R, H_size);
          next_H = time + H_rate;
        }
        break;
      }
    }
    
    field.update();
    field.draw(display);
    /*
    for (const point of points) {
      point.drag();
      point.apply_field(field);
      point.bound(field);
      point.integrate();
      point.draw(display);
    }*/
    
    display.swap();
    ctx.drawImage(display.canvas, 0, 0, 640, 640);
    
    time += config.TIMESTEP;
  }, config.TICKRATE * 1);
}

main();
