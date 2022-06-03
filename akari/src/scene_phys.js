"use strict";

import { config } from "./config.js";
import { input } from "./input.js";
import { plane_t, vec2_t, rand } from "./math.js";
import { draw } from "./canvas.js";

class clip_t {
  constructor(normal, r1, r2)
  {
    this.normal = normal;
    this.r1 = r1;
    this.r2 = r2;
  }
};

class motion_t {
  constructor(mass)
  {
    this.mass = mass;
    this.vel = new vec2_t();
    this.ang_vel = 0.0;
  }
};

class shape_t {
  constructor(pos, rot, vertices)
  {
    this.pos = pos;
    this.rot = rot;
    this.vertices = [];
    this.planes = [];
    
    for (const vertex of vertices) {
      this.vertices.push(vec2_t.add(this.pos, vec2_t.rotate(vertex, rot)));
    }
    
    for (let i = 0; i < this.vertices.length; i++) {
      const a = this.vertices[i];
      const b = this.vertices[(i + 1) % this.vertices.length];
      
      const tangent = vec2_t.sub(b, a);
      const normal = vec2_t.normalize(vec2_t.cross_up(tangent));
      const distance = vec2_t.dot(a, normal);
      
      this.planes.push(new plane_t(normal, distance));
    }
  }
  
  translate(d_pos)
  {
    this.pos = vec2_t.add(this.pos, d_pos);
    
    for (let i = 0; i < this.vertices.length; i++)
      this.vertices[i] = vec2_t.add(this.vertices[i], d_pos);
    
    for (const plane of this.planes)
      plane.distance += vec2_t.dot(plane.normal, d_pos);
  }
  
  rotate(d_rot)
  {
    this.rot += d_rot;
    
    for (let i = 0; i < this.vertices.length; i++) {
      const arm = vec2_t.rotate(vec2_t.sub(this.vertices[i], this.pos), d_rot);
      this.vertices[i] = vec2_t.add(this.pos, arm);
    }
    
    this.planes = [];
    
    for (let i = 0; i < this.vertices.length; i++) {
      const a = this.vertices[i];
      const b = this.vertices[(i + 1) % this.vertices.length];
      
      const tangent = vec2_t.sub(b, a);
      const normal = vec2_t.normalize(vec2_t.cross_up(tangent));
      const distance = vec2_t.dot(a, normal);
      
      this.planes.push(new plane_t(normal, distance));
    }
    
    /*
    for (let i = 0; i < this.vertices.length; i++) {
      const arm = vec2_t.rotate(vec2_t.sub(this.vertices[i], this.pos), d_rot);
      this.vertices[i] = vec2_t.add(this.pos, arm);
    }
    
    for (const plane of this.planes) {
      plane.normal = vec2_t.rotate(plane.normal, d_rot);
      plane.distance = 
    }*/
  }
};

function draw_shape(shape)
{
  for (let i = 0; i < shape.vertices.length; i++) {
    const a = shape.vertices[i];
    const b = shape.vertices[(i + 1) % shape.vertices.length];
    
    draw.line(a, b);
  }
}


function clip_shape_plane(shape, plane)
{
  let min_dist = 100;
  let min_vertex;
  
  for (const vertex of shape.vertices) {
    const dist = vec2_t.dot(vertex, plane.normal) - plane.distance;
    if (dist < min_dist) {
      min_dist = dist;
      min_vertex = vertex;
    }
  }
  
  if (min_dist > 0)
    return null;
  
  const projection = vec2_t.dot(min_vertex, plane.normal) - plane.distance;
  
  const r1 = min_vertex;
  const r2 = vec2_t.add(min_vertex, vec2_t.mulf(plane.normal, -projection));
  
  return new clip_t(plane.normal, r1, r2);
}

function clip_shape_shape(a, b)
{
  let max_plane = null;
  let max_dist = -100;
  let max_vertex;
  let swap = false;
  
  for (const plane of a.planes) {
    let min_dist = 100;
    let min_vertex;
    
    for (const vertex of b.vertices) {
      const dist = vec2_t.dot(vertex, plane.normal) - plane.distance;
      if (dist < min_dist) {
        min_dist = dist;
        min_vertex = vertex;
      }
    }
    
    if (min_dist < 0) {
      if (min_dist > max_dist) {
        max_dist = min_dist;
        max_vertex = min_vertex;
        max_plane = plane;
      }
    } else {
      return null;
    }
  }
  
  for (const plane of b.planes) {
    let min_dist = 0;
    let min_vertex;
    
    for (const vertex of a.vertices) {
      const dist = vec2_t.dot(vertex, plane.normal) - plane.distance;
      
      if (dist < min_dist) {
        min_dist = dist;
        min_vertex = vertex;
      }
    }
    
    if (min_dist < 0) {
      if (min_dist > max_dist) {
        swap = true;
        max_dist = min_dist;
        max_vertex = min_vertex;
        max_plane = new plane_t(vec2_t.mulf(plane.normal, -1), -plane.distance);
      }
    } else {
      return null;
    }
  }
  
  const projection = vec2_t.dot(max_vertex, max_plane.normal) - max_plane.distance;
  
  let r2 = max_vertex;
  let r1 = vec2_t.add(max_vertex, vec2_t.mulf(max_plane.normal, -projection));
  
  if (swap) {
    const tmp = r1;
    r1 = r2;
    r2 = tmp;
  }
  
  return new clip_t(max_plane.normal, r1, r2);
}

const h = 10;
const dt = config.TIMESTEP / h;

export class scene_phys_t {
  shape = {};
  motion = {};
  
  planes = [];
  
  selected_shape = null;
  
  num_entities = 0;
  
  load()
  {
    this.num_entities = 0;
    
    const square_vertices = [
      new vec2_t(-1, +1),
      new vec2_t(+1, +1),
      new vec2_t(+1, -1),
      new vec2_t(-1, -1)
    ];
    
    this.planes.push(new plane_t(new vec2_t(+1, 0), -20));
    this.planes.push(new plane_t(new vec2_t(0, +1), -20));
    this.planes.push(new plane_t(new vec2_t(-1, 0), -20));
    this.planes.push(new plane_t(new vec2_t(0, -1), -20));
    
    const range = 40;
    for (let i = 0; i < 60; i++) {
      const box = this.add_entity();
      this.motion[box] = new motion_t(5.0);
      this.shape[box] = new shape_t(new vec2_t(rand() * range, rand() * range), 0.0, square_vertices);
    }
  }
  
  frame()
  {
    draw.clear();
    
    if (input.get_mouse_button()) {
      for (let i = 0; i < this.num_entities; i++) {
        if (!(i in this.motion) && !(i in this.shape))
          continue;
        
        const dist = vec2_t.length(vec2_t.sub(input.get_mouse_pos(), this.shape[i].pos));
        
        if (dist < 1.0)
          this.selected_shape = i;
      }
    } else {
      this.selected_shape = -1;
    }
    
    for (let i = 0; i < h; i++) {
      this.follow_cursor();
      this.apply_gravity();
      this.clip_shape_plane();
      this.clip_shape_shape();
      this.integrate();
    }
    
    this.draw();
  }
  
  apply_gravity()
  {
    for (let i = 0; i < this.num_entities; i++) {
      if (!(i in this.motion))
        continue;
      
      this.motion[i].vel = vec2_t.add(this.motion[i].vel, new vec2_t(0, -4.0 * dt, 0));
    }
  }
  
  follow_cursor()
  {
    if (this.selected_shape != -1) {
      const i = this.selected_shape;
      const j = vec2_t.sub(this.shape[i].pos, input.get_mouse_pos());
      
      const beta = 0.01 / dt;
      this.motion[i].vel = vec2_t.add(this.motion[i].vel, vec2_t.mulf(j, -beta));
      this.motion[i].vel = vec2_t.mulf(this.motion[i].vel, 0.8);
    }
    
  }
  
  integrate()
  {
    for (let i = 0; i < this.num_entities; i++) {
      if (!(i in this.motion) || !(i in this.shape))
        continue;
      
      const delta_pos = vec2_t.mulf(this.motion[i].vel, dt);
      const delta_rot = this.motion[i].ang_vel * dt;
      
      this.shape[i].translate(delta_pos);
      this.shape[i].rotate(delta_rot);
    }
  }
  
  clip_shape_plane()
  {
    for (let i = 0; i < this.num_entities; i++) {
      if (!(i in this.shape) && !(i in this.motion))
        continue;
      
      for (const plane of this.planes) {
        const clip = clip_shape_plane(this.shape[i], plane);
        
        if (!clip)
          continue;
        
        const r = vec2_t.sub(clip.r1, this.shape[i].pos);
        
        const jt_v = clip.normal;
        const jt_w = vec2_t.cross(r, clip.normal);
        
        const v = this.motion[i].vel;
        const w = this.motion[i].ang_vel;
        
        const m = 1.0 / this.motion[i].mass;
        const m_i = 1.0 / (vec2_t.length(r) * this.motion[i].mass);
        
        const c = vec2_t.dot(vec2_t.sub(clip.r1, clip.r2), clip.normal);
        
        const b = 0.1 / dt * c;
        const jv = vec2_t.dot(jt_v, v) + jt_w * w;
        const effective_mass = vec2_t.dot(jt_v, jt_v) + jt_w * jt_w * m_i;
        
        const lambda = -(jv + b);
        
        if (lambda > 0) {
          const dv = vec2_t.mulf(jt_v, lambda * m);
          const dw = jt_w * lambda * m_i;
          
          this.motion[i].vel = vec2_t.add(this.motion[i].vel, dv);
          this.motion[i].ang_vel += dw;
        }
      }
    }
  }
  
  clip_shape_shape()
  {
    for (let i = 0; i < this.num_entities; i++) {
      if (!(i in this.shape) && !(i in this.motion))
        continue;
      
      for (let j = i + 1; j < this.num_entities; j++) {
        if (!(i in this.shape) && !(i in this.motion))
          continue;
        
        const clip = clip_shape_shape(this.shape[i], this.shape[j]);
        
        if (!clip)
          continue;
        
        const r1 = vec2_t.sub(clip.r1, this.shape[i].pos);
        const r2 = vec2_t.sub(clip.r2, this.shape[j].pos);
        
        const jt_va = clip.normal;
        const jt_wa = vec2_t.cross(r1, clip.normal);
        const jt_vb = vec2_t.mulf(clip.normal, -1);
        const jt_wb = -vec2_t.cross(r2, clip.normal);
        
        const m_a = 1.0 / this.motion[i].mass;
        const i_a = 1.0 / (vec2_t.length(r1) * this.motion[i].mass);
        const m_b = 1.0 / this.motion[j].mass;
        const i_b = 1.0 / (vec2_t.length(r2) * this.motion[j].mass);
        
        const v_a = vec2_t.add(this.motion[i].vel, vec2_t.mulf(vec2_t.cross_up(r1), this.motion[i].ang_vel));
        const w_a = this.motion[i].ang_vel;
        const v_b = vec2_t.add(this.motion[j].vel, vec2_t.mulf(vec2_t.cross_up(r2), this.motion[j].ang_vel));
        const w_b = this.motion[j].ang_vel;
        
        const c = vec2_t.dot(vec2_t.sub(clip.r1, clip.r2), clip.normal);
        
        const b = 0.05 / dt * c;
        const jv = vec2_t.dot(jt_va, v_a) + w_a * jt_wa + vec2_t.dot(jt_vb, v_b) + w_b * jt_wb;
        const effective_mass = vec2_t.dot(jt_va, jt_va) * m_a + jt_wa * jt_wa * i_a + vec2_t.dot(jt_vb, jt_vb) * m_b + jt_wb * jt_wb * i_b;
        
        const lambda = -(jv + b) / effective_mass;
        
        if (lambda < 0) {
          const dv_a = vec2_t.mulf(jt_va, lambda * m_a);
          const dw_a = jt_wa * lambda * i_a;
          const dv_b = vec2_t.mulf(jt_vb, lambda * m_b);
          const dw_b = jt_wb * lambda * i_b;
          
          this.motion[i].vel = vec2_t.add(this.motion[i].vel, dv_a);
          this.motion[i].ang_vel += dw_a;
          
          this.motion[j].vel = vec2_t.add(this.motion[j].vel, dv_b);
          this.motion[j].ang_vel += dw_b;
        }
      }
    }
  }
  
  draw()
  {
    for (let i = 0; i < this.num_entities; i++) {
      if (!(i in this.shape))
        continue;
      
      draw_shape(this.shape[i]);
      
      // for (const plane of this.shape[i].planes) draw.plane(plane);
    }
    
    for (const plane of this.planes)
      draw.plane(plane);
  }
  
  add_entity()
  {
    return this.num_entities++;
  }
};
