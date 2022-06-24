"use strict";

import { vec2_t } from "./math.js";
import { config } from "./config.js";

const c = document.getElementById("canvas");
const ctx = c.getContext("2d");

function screen_space(pos)
{
  return new vec2_t(pos.x * config.SCALE + c.width / 2.0, -pos.y * config.SCALE + c.height / 2.0);
}

export class draw {
  static color(r, g, b)
  {
    ctx.fillStyle = "rgb(" + r.toString() + "," + g.toString() + "," + b.toString() + ")";
    ctx.strokeStyle = "rgb(" + r.toString() + "," + g.toString() + "," + b.toString() + ")";
  }

  static clear()
  {
    ctx.clearRect(0, 0, c.width, c.height);
  }

  static circle(pos, radius)
  {
    const screen_pos = screen_space(pos);
    ctx.beginPath();
    ctx.arc(screen_pos.x, screen_pos.y, radius * config.SCALE, 0, 2 * Math.PI);
    ctx.stroke();
  }

  static line(a, b)
  {
    const ss_a = screen_space(a);
    const ss_b = screen_space(b);
    
    ctx.beginPath();
    ctx.moveTo(ss_a.x, ss_a.y);
    ctx.lineTo(ss_b.x, ss_b.y);
    ctx.stroke();
  }

  static plane(plane)
  {
    const tangent = vec2_t.cross_up(plane.normal);
    const pos = vec2_t.mulf(plane.normal, plane.distance);
    
    const seg_a = vec2_t.add(pos, vec2_t.mulf(tangent, -100));
    const seg_b = vec2_t.add(pos, vec2_t.mulf(tangent, +100));
    const seg_c = vec2_t.add(pos, vec2_t.mulf(plane.normal, 1));
    
    draw.line(pos, seg_a);
    draw.line(pos, seg_b);
    draw.line(pos, seg_c);
  }
}
