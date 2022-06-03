"use strict";

import { vec2_t } from "./math.js";

const c = document.getElementById("canvas");
const ctx = c.getContext("2d");

const SCALE = 10;

function screen_space(pos)
{
  return new vec2_t(pos.x * SCALE + c.width / 2.0, -pos.y * SCALE + c.height / 2.0);
}

export function d_color(r, g, b)
{
  ctx.fillStyle = "rgb(" + r.toString() + "," + g.toString() + "," + b.toString() + ")";
  ctx.strokeStyle = "rgb(" + r.toString() + "," + g.toString() + "," + b.toString() + ")";
}

export function d_clear()
{
  ctx.clearRect(0, 0, c.width, c.height);
}

export function d_circle(pos, radius)
{
  const screen_pos = screen_space(pos);
  ctx.beginPath();
  ctx.arc(screen_pos.x, screen_pos.y, radius * SCALE, 0, 2 * Math.PI);
  ctx.stroke();
}

export function d_line(a, b)
{
  const ss_a = screen_space(a);
  const ss_b = screen_space(b);
  
  ctx.beginPath();
  ctx.moveTo(ss_a.x, ss_a.y);
  ctx.lineTo(ss_b.x, ss_b.y);
  ctx.stroke();
}

export function d_plane(plane)
{
  const tangent = vec2_t.cross_up(plane.normal);
  const pos = vec2_t.mulf(plane.normal, plane.distance);
  
  const seg_a = vec2_t.add(pos, vec2_t.mulf(tangent, -100));
  const seg_b = vec2_t.add(pos, vec2_t.mulf(tangent, +100));
  const seg_c = vec2_t.add(pos, vec2_t.mulf(plane.normal, 1));
  
  d_line(pos, seg_a);
  d_line(pos, seg_b);
  d_line(pos, seg_c);
}
