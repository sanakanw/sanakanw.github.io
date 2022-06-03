import { config } from "./config.js";
import { plane_t, vec2_t } from "./common/math.js";
import { scene_t } from "./common/scene.js";
import { d_color, d_plane, d_line, d_circle, d_clear } from "./common/canvas.js";
  
const TIMESTEP = 1000.0 / config.TICKRATE;

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
  let E_x0 = new vec2_t(0, 0);
  for (const q of points) {
    const d_pos = vec2_t.sub(q.pos, pos);
    const d_2 = vec2_t.dot(d_pos, d_pos);
    
    E_x0 = vec2_t.add(E_x0, vec2_t.mulf(new vec2_t(d_pos.x / d_2, d_pos.y / d_2), q.charge));
  }
  
  return E_x0;
}

const d = new vec2_t(0.1, 0.1);

function div_E(pos)
{
  const dE = vec2_t.sub(E(vec2_t.add(pos, d)), E(vec2_t.sub(pos, d))); 
  return dE.x / d.x + dE.y / d.y;
}

function curl_E(pos)
{
  const dE = vec2_t.sub(E(vec2_t.add(pos, d)), E(vec2_t.sub(pos, d))); 
  return dE.y / d.x - dE.x / d.x;
}

function field_init()
{
  points.push(new point_t(new vec2_t(0, 5), 1, new vec2_t(0.0, 0.0)));
  
  const BOUND_DIST = 20;
  
  planes.push(new plane_t(new vec2_t( 0, +1), -BOUND_DIST));
  planes.push(new plane_t(new vec2_t( 0, -1), -BOUND_DIST));
  planes.push(new plane_t(new vec2_t(+1,  0), -BOUND_DIST));
  planes.push(new plane_t(new vec2_t(-1,  0), -BOUND_DIST));
}

function field_update()
{
  point_apply_forces();
  point_clip();
  point_clip_planes();
  point_drag();
  point_integrate();
  
  d_clear();
  point_draw();
  field_draw();
  plane_draw();
  
  t += TIMESTEP;
}

function point_clip()
{
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    
    for (let j = i + 1; j < points.length; j++) {
      const b = points[j];
      
      const delta_pos = vec2_t.sub(a.pos, b.pos);
      const dist_2 = vec2_t.dot(delta_pos, delta_pos);
      
      if (dist_2 < 1.0) {
        const normal = vec2_t.normalize(delta_pos);
        
        const v_r = vec2_t.sub(a.vel, b.vel);
        const v_j = -1.0 * vec2_t.dot(v_r, normal);
        
        const j = v_j / 2.0 + 0.0005 * Math.sqrt(dist_2);
        
        a.vel = vec2_t.add(a.vel, vec2_t.mulf(normal, j));
        b.vel = vec2_t.add(b.vel, vec2_t.mulf(normal, -j));
      }
    }
  }
}

function point_clip_planes()
{
  for (const q of points) {
    for (const plane of planes) {
      const dist = vec2_t.dot(q.pos, plane.normal) - plane.distance - 0.5;
      
      if (dist < 0.0) {
        const v_j = -2.0 * vec2_t.dot(q.vel, plane.normal);
        q.pos = vec2_t.add(q.pos, vec2_t.mulf(plane.normal, -dist));
        q.vel = vec2_t.add(q.vel, vec2_t.mulf(plane.normal, v_j));
      }
    }
  }
}

function point_drag()
{
  for (const point of points) {
    point.vel = vec2_t.mulf(point.vel, 1.0);
  }
}

function point_apply_forces()
{
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d_pos = vec2_t.sub(points[i].pos, points[j].pos);
      const d_2 = vec2_t.dot(d_pos, d_pos);
      
      const F = 0.001 * points[i].charge * points[j].charge / d_2;
      const r = vec2_t.normalize(d_pos);
      
      const vel = vec2_t.mulf(r, F);
      
      points[i].vel = vec2_t.add(points[i].vel, vel);
      points[j].vel = vec2_t.add(points[j].vel, vec2_t.mulf(vel, -1));
    }
  }
}

function point_integrate()
{
  for (const point of points) {
    point.pos = vec2_t.add(point.pos, vec2_t.mulf(point.vel, TIMESTEP));
  }
}

function point_draw()
{
  const POINT_RADIUS = 0.5;
  
  for (const point of points)
    d_circle(point.pos, POINT_RADIUS);
}

function field_draw()
{
  const SCALE = 2;
  
  for (let y = -10; y < 10; y++) {
    for (let x = -10; x < 10; x++) {
      const pos = vec2_t.mulf(new vec2_t(x, y), SCALE);
      
      const Epos = E(pos);
      const divEpos = curl_E(pos) * 10;
      
      const len_E = Math.min(5 * vec2_t.length(Epos), 1.0);
      const dir_E = vec2_t.mulf(vec2_t.normalize(Epos), len_E);
      
      const len_div_E = Math.min(Math.abs(divEpos), 0.5);
      
      d_color(Math.abs(divEpos) * 100, 0, Math.abs(divEpos * 100) / 2);
      d_circle(pos, len_div_E);
      d_color(0, 0, 0);
      
      d_line(pos, vec2_t.add(pos, dir_E));
    }
  }
}

function plane_draw()
{
  for (const plane of planes)
    d_plane(plane);
}

export const field_scene = new scene_t(field_init, field_update);
