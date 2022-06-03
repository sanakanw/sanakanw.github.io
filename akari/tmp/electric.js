import { config } from "./config.js";
import { plane_t, vec2_t } from "./common/math.js";
import { scene_t } from "./common/scene.js";
import { d_color, d_plane, d_line, d_circle, d_clear } from "./common/canvas.js";
  
const TIMESTEP = 1.0 / config.TICKRATE;

const width = 40;
const height = 40;

const H_field = [];
const E_field = [];

const points = [];
const planes = [];

let t = 0.0;

class point_t {
  constructor(pos, charge, vel)
  {
    this.pos = pos;
    this.charge = charge;
    this.vel = vel;
  }
};

function rand()
{
  return Math.random() - 0.5;
}

function E(pos)
{
  const d_2 = vec2_t.dot(pos, pos) + 0.01;
  return vec2_t.mulf(new vec2_t(pos.x / d_2, pos.y / d_2), 1.0);
}


function E_at(pos)
{
   let xp = Math.floor(pos.x) + width / 2;
  let yp = Math.floor(pos.y) + height / 2;
  
  if (xp < 0)
    xp = 0;
  if (yp < 0)
    yp = 0;
  if (xp >= width)
    xp = width - 1;
  if (yp >= height)
    yp = height - 1;
    
  return E_field[yp][xp];
}

function curl_E_at(pos)
{
  const dEx_dy = vec2_t.sub(
    E_at(vec2_t.add(pos, new vec2_t(0, 1))),
    E_at(vec2_t.add(pos, new vec2_t(0, -1)))
  );
  
  const dEy_dx = vec2_t.sub(
    E_at(vec2_t.add(pos, new vec2_t(1, 0))),
    E_at(vec2_t.add(pos, new vec2_t(-1, 0)))
  );
  
  return dEy_dx.y / 2.0 - dEx_dy.x / 2.0;
}

function H_at(pos)
{
  let xp = Math.floor(pos.x) + width / 2;
  let yp = Math.floor(pos.y) + height / 2;
    
  if (xp < 0 || yp < 0 || xp >= width || yp >= height)
    return 0;
  
  return H_field[yp][xp];
}

function curl_H_at(pos)
{ 
  const dHz_dx = H_at(vec2_t.add(pos, new vec2_t(1, 0))) - H_at(vec2_t.add(pos, new vec2_t(-1, 0)));
  const dHz_dy = H_at(vec2_t.add(pos, new vec2_t(0, 1))) - H_at(vec2_t.add(pos, new vec2_t(0, -1)));
  
  return new vec2_t(dHz_dy / 2.0, -dHz_dx / 2.0);
}

function electric_init()
{
  const c = document.getElementById("canvas");
  
  c.onmousedown = function(e) {
    const pos = vec2_t.mulf(
      new vec2_t(e.offsetX - c.width / 2, -e.offsetY + c.height / 2),
    1.0 / 10);
    
    emit(pos);
  };
  
  for (let y = 0; y < height; y++) {
    E_field[y] = [];
    H_field[y] = [];
    for (let x = 0; x < width; x++) {
      E_field[y][x] = vec2_t.mulf(E(new vec2_t(x - width / 2, y - height / 2)), 10);
      H_field[y][x] = 0.0;
    }
  }
}

function emit(pos)
{
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = vec2_t.sub(new vec2_t(x - width / 2, y - height / 2), pos);
      E_field[y][x] = vec2_t.add(E_field[y][x], vec2_t.mulf(E(d), 1.0));
    }
  }
}

function electric_update()
{
  E_field_update();
  H_field_update();
  
  d_clear();
  electric_draw();
  
  t += TIMESTEP;
}

function E_field_update()
{
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = new vec2_t(x - width / 2, y - height / 2);
      const curl = curl_E_at(pos);
      
      H_field[y][x] += -curl * TIMESTEP * 9.0;
    }
  }
}

function H_field_update()
{
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = new vec2_t(x - width / 2, y - height / 2);
      
      const H_pos = H_at(pos);
      
      const curl_H = curl_H_at(pos);
      const J = vec2_t.mulf(E_field[y][x], 0.05);
      
      const dE = vec2_t.sub(curl_H, J);
      
      E_field[y][x] = vec2_t.add(E_field[y][x], vec2_t.mulf(dE, 15.0 * TIMESTEP));
    }
  }
}

function electric_draw()
{
  for (let y = -height / 2; y < height / 2; y++) {
    for (let x = -width / 2; x < width / 2; x++) {
      const pos = new vec2_t(x, y);
      
      const E_pos = E_at(pos);
      const H_pos = H_at(pos);
      
      const len_E = Math.min(0.5 * vec2_t.length(E_pos), 1.0);
      const dir_E = vec2_t.mulf(vec2_t.normalize(E_pos), len_E);
      
      d_circle(pos, 0.1 + Math.min(2 * Math.abs(H_pos), 0.5));
      d_line(pos, vec2_t.add(pos, dir_E));
    }
  }
}

export const electric_scene = new scene_t(electric_init, electric_update);
