import { config } from "./config.js";
import { plane_t, vec2_t } from "./common/math.js";
import { scene_t } from "./common/scene.js";
import { d_color, d_plane, d_line, d_circle, d_clear } from "./common/canvas.js";

const TIMESTEP = 1.0 / config.TICKRATE;

function rand()
{
  return Math.random() - 0.5;
}

function A(pos)
{
  if (0) {
    return new vec2_t(
      -Math.sin(pos.x / 4.0),
      -Math.cos(pos.y / 4.0),
    );
  }
  if (0) {
    return new vec2_t(
      pos.y * pos.y - pos.x,
      pos.x * pos.x - pos.y
    );
  }
  
  if (1) {
    const p = vec2_t.sub(pos, new vec2_t(0, -10))
    const q = vec2_t.sub(pos, new vec2_t(0, 5));
    
    const a = vec2_t.mulf(p, 1.0 / vec2_t.dot(p, p));
    const b = vec2_t.mulf(q, -1.0 / vec2_t.dot(q, q));
    
    return a;//vec2_t.add(a, b);
  }
}

const d = new vec2_t(0.1, 0.1);

function div_A(pos)
{
  const dA = vec2_t.sub(A(vec2_t.add(pos, d)), A(vec2_t.sub(pos, d))); 
  return dA.x / d.x + dA.y / d.y;
}

function curl_A(pos)
{
  const dA = vec2_t.sub(A(vec2_t.add(pos, d)), A(vec2_t.sub(pos, d))); 
  return dA.y / d.x - dA.x / d.x;
}

function field2_init()
{
  d_clear();
  
  const SCALE = 2;
  
  const s = 10;
  
  let sum_curl = 0;
  
  for (let y = -s; y <= s; y++) {
    for (let x = -s; x <= s; x++) {
      const pos = vec2_t.mulf(new vec2_t(x, y), SCALE);
      
      const v = A(pos);
      
      const len = vec2_t.length(v);
      const d_len = Math.min(len * 10, 1.0);
      
      const div = div_A(pos);
      const curl = curl_A(pos);
      
      sum_curl += curl;
      
      const d_curl = Math.min(Math.abs(curl) * 3, 1.0);
      
      if (curl < 0)
        d_color(255, 0, 0);
      else
        d_color(0, 0, 255);
      d_circle(pos, d_curl);
      
      d_color(0, 0, 0);
      
      d_circle(pos, 0.1);
      d_line(pos, vec2_t.add(pos, vec2_t.mulf(vec2_t.normalize(v), d_len)));
    }
  }
  
  console.log(sum_curl);
}

function field2_update()
{
}

export const field2_scene = new scene_t(field2_init, field2_update);
