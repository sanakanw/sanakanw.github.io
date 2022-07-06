"use strict";

import { input } from "../lib/input.js";
import { config } from "../lib/config.js";
import { vec2_t } from "../lib/math.js";
import { draw } from "../lib/draw.js";

let t = 0;

function curl(A, p)
{
  const d = 0.01;
  
  const dx = new vec2_t(d, 0.0);
  const dy = new vec2_t(0.0, d);
  
  const dA_dx = vec2_t.sub(A(vec2_t.add(p, dx)), A(vec2_t.sub(p, dx)));
  const dA_dy = vec2_t.sub(A(vec2_t.add(p, dy)), A(vec2_t.sub(p, dy)));
  
  return dA_dx.y / d - dA_dy.x / d;
}

function curl_2(curl_A, p)
{
  const d = 0.01;
  
  const dx = new vec2_t(d, 0.0);
  const dy = new vec2_t(0.0, d);
  
  const dAz_dx = curl_A(vec2_t.add(p, dx)) - curl_A(vec2_t.sub(p, dx));
  const dAz_dy = curl_A(vec2_t.add(p, dy)) - curl_A(vec2_t.sub(p, dy));
  
  return new vec2_t(dAz_dy / d, -dAz_dx / d);
}

function A(p)
{
  return new vec2_t(-Math.cos(p.y + t), p.x);
}

function draw_vector_field()
{
  draw.clear();
  
  const width = 40;
  const height = 40;
  
  for (let y = -height / 2; y < height / 2; y++) {
    for (let x = -width / 2; x < width / 2; x++) {
      const pos = new vec2_t(x, y);
      
      const A_pos = A(pos);
      const len_A = Math.min(0.1 * vec2_t.length(A_pos), 0.5);
      const dir_A = vec2_t.mulf(vec2_t.normalize(A_pos), len_A);
      
      const curl_A_pos = curl(A, pos);
      const len_curl_A = Math.min(0.1 *  Math.abs(curl_A_pos), 0.5);
      
      const curl_2_A_pos = curl_2((pos) => curl(A, pos), pos);
      const len_curl_2_A = Math.min(0.1 * vec2_t.length(curl_2_A_pos), 0.5);
      const dir_curl_2_A = vec2_t.mulf(vec2_t.normalize(curl_2_A_pos), len_curl_2_A);
      
      draw.circle(pos, len_curl_A);
      draw.line(pos, vec2_t.add(pos, dir_A));
      draw.line(pos, vec2_t.add(pos, dir_curl_2_A));
    }
  }
}

function main()
{
  draw.color(255, 255, 255);
  
  setInterval(function() {
    draw_vector_field();
    t += 0.1;
  }, config.TIMESTEP);
}

main();
