import { config } from "./config.js";
import { plane_t, vec2_t } from "./common/math.js";
import { scene_t } from "./common/scene.js";
import { d_plane, d_line, d_circle, d_clear } from "./common/canvas.js";
  
const TIMESTEP = 1.0 / config.TICKRATE;
const GRAVITY = 9.8;

class point_t {
  constructor(pos, mass)
  {
    this.pos = pos;
    this.mass = mass;
    this.vel = new vec2_t(0, 0);
  }
}

class constraint_t {
  constructor(a, b)
  {
    this.a = a;
    this.b = b;
  }
};

const points = [];
const dynamic_constraints = [];
const static_constraints = [];

function rand()
{
  return Math.random() - 0.5;
}

function rope_init()
{
  /*
  const a = new point_t(new vec2_t(4.0, 0.0), 1.0);
  const b = new point_t(new vec2_t(8.0, 0.0), 1.0);
  const c = new point_t(new vec2_t(12.0, 0.0), 1.0);
  
  // static_constraints.push(new constraint_t(a, new vec2_t(0.0, 0.0)));
  // dynamic_constraints.push(new constraint_t(a, b));
  
  b.vel = new vec2_t(-1.0, 1.0);
  
  points.push(a);
  points.push(b);
  points.push(c);*/
  
  for (let i = 0; i < 10; i++)
    points.push(new point_t(new vec2_t(i * 4.0), 1.0));
  
  points[0].vel = new vec2_t(-4.0, 10.0);
}

function rope_update()
{
  // apply_gravity();
  
  for (let i = 0; i < 10; i++) {
    apply_constraint();
    integrate(TIMESTEP / 10);
  }
  
  d_clear();
  r_point();
}

function apply_gravity()
{
  for (const point of points)
    point.vel.y -= point.mass * GRAVITY * TIMESTEP;
}

function apply_constraint()
{
  const J = [];
  const V = [];
  const b = [];
  
  const bias = 1.0;
  for (let i = 0; i < points.length - 1; i++) {
    J.push([
      vec2_t.sub(points[i].pos, points[i + 1].pos),
      vec2_t.sub(points[i + 1].pos, points[i].pos)
    ]);
    
    V.push([
      points[i].vel,
      points[i + 1].vel
    ]);
    
    const l = vec2_t.length(vec2_t.sub(points[i].pos, points[i + 1].pos));
    
    b.push(bias * (l - 4.0));
  }
  
  for (let i = 0; i < J.length; i++) {
    let JV = 0;
    let effective_mass = 0;
    
    for (let j = 0; j < J[i].length; j++) {
      JV += vec2_t.dot(V[i][j], J[i][j]);
      effective_mass += vec2_t.dot(J[i][j], J[i][j]);
    }
    
    for (let j = 0; j < J[i].length; j++) {
      const lambda = -(JV + b[i]) / effective_mass;
      const dv = vec2_t.mulf(J[i][j], lambda);
      
      V[i][j].x += dv.x;
      V[i][j].y += dv.y;
    }
  }
}

function integrate(dt)
{
  for (const point of points) {
    point.pos = vec2_t.add(point.pos, vec2_t.mulf(point.vel, dt));
  }
}

function r_point()
{
  for (let i = 0; i < points.length - 1; i++)
    d_line(points[i].pos, points[i + 1].pos);
  
  for (const point of points)
    d_circle(point.pos, 0.5);
}

export const rope_scene = new scene_t(rope_init, rope_update);
