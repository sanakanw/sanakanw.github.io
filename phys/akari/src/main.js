"use strict"

import { plane_t, to_rad, vec2_t } from "./math.js";
import { d_plane, d_clear, d_line, d_circle } from "./canvas.js";

function rand()
{
  return Math.random() - 0.5;
}

class circle_t {
  constructor(pos, vel, mass, e, radius)
  {
    this.pos = pos;
    this.vel = vel;
    this.mass = mass;
    this.e = e;
    this.radius = radius;
  }
};

class capsule_t {
  constructor(pos, vel, angular_vel, mass, inertia, e, arm, radius)
  {
    this.pos = pos;
    this.vel = vel;
    this.angular_vel = angular_vel;
    this.mass = mass;
    this.inertia = inertia;
    this.e = e;
    this.arm = arm;
    this.radius = radius;
  }
};

class constraint_t {
  constructor(a, b, l)
  {
    this.a = a;
    this.b = b;
    this.l = l;
  }
};

class clip_t {
  constructor(normal, distance, contact_point)
  {
    this.normal = normal;
    this.distance = distance;
    this.contact_point = contact_point;
  }
};

const PHYS_GRAVITY = 40;
const PHYS_DT = 0.015;

function clip_circle_plane(circle, plane)
{
  const distance = vec2_t.dot(circle.pos, plane.normal) - plane.distance - circle.radius;
  const normal = plane.normal;
  
  const contact_point = vec2_t.add(circle.pos, vec2_t.mulf(plane.normal, -circle.radius));
  
  return new clip_t(normal, distance, contact_point);
}

function clip_circle_circle(a, b)
{
  const delta_dist = vec2_t.sub(b.pos, a.pos);
  const distance = vec2_t.length(delta_dist) - (a.radius + b.radius);
  const normal = vec2_t.normalize(delta_dist);
  
  const contact_point = vec2_t.add(a.pos, vec2_t.mulf(delta_dist, 0.5));
  
  return new clip_t(normal, distance, contact_point);
}

function clip_capsule_plane(capsule, plane)
{
  const pos_a = vec2_t.sub(capsule.pos, capsule.arm);
  const pos_b = vec2_t.add(capsule.pos, capsule.arm);
  
  const d_a = vec2_t.dot(pos_a, plane.normal) - plane.distance - capsule.radius;
  const d_b = vec2_t.dot(pos_b, plane.normal) - plane.distance - capsule.radius;
  
  const distance = Math.min(d_a, d_b);
  
  let contact_point;
  if (distance == d_a)
    contact_point = vec2_t.add(pos_a, vec2_t.mulf(plane.normal, -capsule.radius));
  else
    contact_point = vec2_t.add(pos_b, vec2_t.mulf(plane.normal, -capsule.radius));
  
  return new clip_t(plane.normal, distance, contact_point);
}

function clip_capsule_circle(capsule, circle)
{
  const pos_a = vec2_t.sub(capsule.pos, capsule.arm);
  const pos_b = vec2_t.add(capsule.pos, capsule.arm);
  const normal = vec2_t.normalize(vec2_t.cross_up(capsule.arm));
  const dist = vec2_t.dot(capsule.pos, normal);
  
  const plane_dist = vec2_t.dot(circle.pos, normal) - dist;
  const distance = Math.abs(plane_dist) - capsule.radius - circle.radius;
  
  if (distance < 0) {
    const d_arm = vec2_t.normalize(capsule.arm);
    const t = vec2_t.dot(circle.pos, d_arm);
    
    const bound_a = vec2_t.dot(pos_a, d_arm);
    const bound_b = vec2_t.dot(pos_b, d_arm);
    
    if (t + circle.radius > bound_a - capsule.radius && t < bound_a) {
      const delta_dist = vec2_t.sub(circle.pos, pos_a);
      const clip_distance = vec2_t.length(delta_dist) - (capsule.radius + circle.radius);
      const clip_normal = vec2_t.normalize(delta_dist);
      const contact_point = vec2_t.add(circle.pos, vec2_t.mulf(clip_normal, -circle.radius));
      
      return new clip_t(vec2_t.mulf(clip_normal, -1), clip_distance, contact_point);
    } else if (t - circle.radius < bound_b + capsule.radius && t > bound_b) {
      const delta_dist = vec2_t.sub(circle.pos, pos_b);
      const clip_distance = vec2_t.length(delta_dist) - (capsule.radius + circle.radius);
      const clip_normal = vec2_t.normalize(delta_dist);
      const contact_point = vec2_t.add(circle.pos, vec2_t.mulf(clip_normal, -circle.radius));
      
      return new clip_t(vec2_t.mulf(clip_normal, -1), clip_distance, contact_point);
    } else if (t > bound_a && t < bound_b) {
      const clip_normal = vec2_t.mulf(normal, plane_dist < 0 ? +1 : -1);
      const contact_point = vec2_t.add(circle.pos, vec2_t.mulf(clip_normal, circle.radius));
      
      return new clip_t(clip_normal, distance, contact_point);
    }
  }
  
  return new clip_t(new vec2_t(), 0, new vec2_t());
}

function clip_capsule_capsule(a, b)
{
  const a_pos_a = vec2_t.sub(a.pos, a.arm);
  const a_pos_b = vec2_t.add(a.pos, a.arm);
  
  const b_pos_a = vec2_t.sub(b.pos, b.arm);
  const b_pos_b = vec2_t.add(b.pos, b.arm);
  
  const clips = [
    clip_capsule_circle(a, new circle_t(b_pos_a, null, null, null, b.radius)),
    clip_capsule_circle(a, new circle_t(b_pos_b, null, null, null, b.radius)),
    clip_capsule_circle(b, new circle_t(a_pos_a, null, null, null, a.radius)),
    clip_capsule_circle(b, new circle_t(a_pos_b, null, null, null, a.radius)),
  ];
  
  clips[2].normal = vec2_t.mulf(clips[2].normal, -1);
  clips[3].normal = vec2_t.mulf(clips[3].normal, -1);
  
  let max = -1;
  for (let i = 0; i < 4; i++) {
    if (clips[i].distance < 0 && (max == -1 || clips[i].distance < clips[max].distance)) {
      max = i;
    }
  }
  
  if (max > -1)
    return clips[max];
  
  return new clip_t(new vec2_t(), 0, new vec2_t());
}

class phys_t {
  constructor()
  {
    this.circles = [];
    this.capsules = [];
    this.planes = [];
    this.dynamic_constraints = [];
    this.gravity = false;
  }
  
  apply_gravity(dt)
  {
    for (const circle of this.circles)
      circle.vel.y -= PHYS_GRAVITY * dt;
    
    for (const capsule of this.capsules)
      capsule.vel.y -= PHYS_GRAVITY * dt;
  }
  
  integrate(dt)
  {
    for (const circle of this.circles) {
      circle.pos = vec2_t.add(circle.pos, vec2_t.mulf(circle.vel, dt));
    }
    
    for (const capsule of this.capsules) {
      capsule.pos = vec2_t.add(capsule.pos, vec2_t.mulf(capsule.vel, dt));
      capsule.arm = vec2_t.rotate(capsule.arm, capsule.angular_vel * dt);
    }
  }
  
  clip_circles()
  {
    for (let i = 0; i < this.circles.length; i++) {
      const a = this.circles[i];
      
      for (let j = i + 1; j < this.circles.length; j++) {
        const b = this.circles[j];
        
        const clip = clip_circle_circle(a, b);
        if (clip.distance < 0) {
          const m_a = 1.0 / a.mass;
          const m_b = 1.0 / b.mass;
          
          const e = Math.min(a.e, b.e);
          
          const v_r = vec2_t.sub(a.vel, b.vel);
          const v_j = -(1 + e) * vec2_t.dot(v_r, clip.normal);
          
          const effective_mass = m_a + m_b;
          
          const j = v_j / effective_mass;
          
          a.pos = vec2_t.add(a.pos, vec2_t.mulf(clip.normal, +clip.distance));
          b.pos = vec2_t.add(b.pos, vec2_t.mulf(clip.normal, -clip.distance));
          
          a.vel = vec2_t.add(a.vel, vec2_t.mulf(clip.normal, m_a * +j));
          b.vel = vec2_t.add(b.vel, vec2_t.mulf(clip.normal, m_b * -j));
        }
      }
    }
  }
  
  clip_capsules()
  {
    for (let i = 0; i < this.capsules.length; i++) {
      const a = this.capsules[i];
      
      for (let j = i + 1; j < this.capsules.length; j++) {
        const b = this.capsules[j];
        
        const clip = clip_capsule_capsule(a, b);
        if (clip.distance < 0) {
          const r_a = vec2_t.sub(clip.contact_point, a.pos);
          const r_b = vec2_t.sub(clip.contact_point, b.pos);
          
          const m_a = 1.0 / a.mass;
          const m_b = 1.0 / b.mass;
          
          const i_a = 1.0 / (a.inertia * vec2_t.length(r_a));
          const i_b = 1.0 / (b.inertia * vec2_t.length(r_b));
          
          const w_a = vec2_t.mulf(vec2_t.cross_up(r_a), i_a * vec2_t.cross(r_a, clip.normal));
          const w_b = vec2_t.mulf(vec2_t.cross_up(r_b), i_b * vec2_t.cross(r_b, clip.normal));
          
          const e = Math.min(a.e, b.e);
          
          const a_vel = vec2_t.add(a.vel, vec2_t.mulf(vec2_t.cross_up(r_a), a.angular_vel));
          const b_vel = vec2_t.add(b.vel, vec2_t.mulf(vec2_t.cross_up(r_b), b.angular_vel));
          
          const v_r = vec2_t.sub(a_vel, b_vel);
          const v_j = -(1 + e) * vec2_t.dot(v_r, clip.normal);
          
          const effective_mass = m_a + m_b + vec2_t.dot(vec2_t.add(w_a, w_b), clip.normal);
          const beta = 5.0 * clip.distance;
          const j = v_j / effective_mass - beta;
          
          // a.pos = vec2_t.add(a.pos, vec2_t.mulf(clip.normal, -clip.distance));
          a.vel = vec2_t.add(a.vel, vec2_t.mulf(clip.normal, m_a * j));
          a.angular_vel += i_a * vec2_t.cross(r_a, vec2_t.mulf(clip.normal, j));
          
          // b.pos = vec2_t.sub(b.pos, vec2_t.mulf(clip.normal, -clip.distance));
          b.vel = vec2_t.sub(b.vel, vec2_t.mulf(clip.normal, m_b * j));
          b.angular_vel -= i_b * vec2_t.cross(r_b, vec2_t.mulf(clip.normal, j));
        }
      }
    }
  }
  
  clip_planes()
  {
    for (const circle of this.circles) {
      for (const plane of this.planes) {
        const clip = clip_circle_plane(circle, plane);
        
        if (clip.distance < 0) {
          const j = -(1 + circle.e) * vec2_t.dot(circle.vel, clip.normal);
          
          circle.pos = vec2_t.add(circle.pos, vec2_t.mulf(clip.normal, -clip.distance));
          circle.vel = vec2_t.add(circle.vel, vec2_t.mulf(clip.normal, j));
        }
      }
    }
    
    for (const capsule of this.capsules) {
      for (const plane of this.planes) {
        const clip = clip_capsule_plane(capsule, plane);
        
        if (clip.distance < 0) {
          const r = vec2_t.sub(clip.contact_point, capsule.pos);
          
          const inverse_mass = 1.0 / capsule.mass;
          const inverse_inertia = 1.0 / (capsule.inertia * vec2_t.length(r));
          
          const j_w = vec2_t.mulf(vec2_t.cross_up(r), inverse_inertia * vec2_t.cross(r, clip.normal));
          const j_v = -(1 + capsule.e) * vec2_t.dot(capsule.vel, clip.normal);
          
          const j = j_v / (inverse_mass + vec2_t.dot(j_w, plane.normal));
          
          capsule.pos = vec2_t.add(capsule.pos, vec2_t.mulf(clip.normal, -clip.distance));
          capsule.vel = vec2_t.add(capsule.vel, vec2_t.mulf(clip.normal, inverse_mass * j));
          capsule.angular_vel += inverse_inertia * vec2_t.cross(r, vec2_t.mulf(clip.normal, j));
        }
      }
    }
  }
  
  constrain_dynamic()
  {
    for (const dynamic_constraint of this.dynamic_constraints) {
      const a = dynamic_constraint.a;
      const b = dynamic_constraint.b;
      
      const delta_pos = vec2_t.sub(a.pos, b.pos);
      
      const l = vec2_t.length(delta_pos);
      
      const n = vec2_t.normalize(delta_pos);
      
      const jv_a = new vec2_t(n.x, n.y);
      const jv_b = new vec2_t(-n.x, -n.y);
      
      const beta = 2.0 * (l - dynamic_constraint.l);
      
      const effective_mass = 1 / a.mass + 1 / b.mass;
      
      const j = -(vec2_t.dot(jv_a, a.vel) + vec2_t.dot(jv_b, b.vel)) / effective_mass - beta;
      
      a.vel = vec2_t.add(a.vel, vec2_t.mulf(jv_a, j));
      b.vel = vec2_t.add(b.vel, vec2_t.mulf(jv_b, j));
    }
  }
  
  update()
  {
    const h = 10;
    const dt = PHYS_DT / h
    for (let i = 0; i < h; i++) {
      if (this.gravity)
        this.apply_gravity(dt);
      
      this.constrain_dynamic();
      this.clip_circles();
      this.clip_capsules();
      this.clip_planes();
      this.integrate(dt);
    }
  }
};

function render_phys(phys)
{
  for (const plane of phys.planes) {
    d_plane(plane);
  }
  
  for (const capsule of phys.capsules) {
    const pos_a = vec2_t.sub(capsule.pos, capsule.arm);
    const pos_b = vec2_t.add(capsule.pos, capsule.arm);
    
    const tangent = vec2_t.normalize(vec2_t.cross_up(capsule.arm));
    
    const seg_a0 = vec2_t.add(pos_a, vec2_t.mulf(tangent, capsule.radius));
    const seg_a1 = vec2_t.add(pos_b, vec2_t.mulf(tangent, capsule.radius));
    
    const seg_b0 = vec2_t.add(pos_a, vec2_t.mulf(tangent, -capsule.radius));
    const seg_b1 = vec2_t.add(pos_b, vec2_t.mulf(tangent, -capsule.radius));
    
    d_line(seg_a0, seg_a1);
    d_line(seg_b0, seg_b1);
    
    d_circle(pos_a, capsule.radius);
    d_circle(pos_b, capsule.radius);
    
    d_circle(capsule.pos, 0.5);
  }
  
  for (const dynamic_constraint of phys.dynamic_constraints)
    d_line(dynamic_constraint.a.pos, dynamic_constraint.b.pos);
  
  for (const circle of phys.circles)
    d_circle(circle.pos, circle.radius);
}

function frame(phys)
{
  d_clear();
  phys.update();
  render_phys(phys);
}

function load_planes(phys)
{
  const theta = 2;
  
  phys.planes.push(new plane_t(vec2_t.rotate(new vec2_t(1, 0), to_rad(theta)), -30));
  phys.planes.push(new plane_t(vec2_t.rotate(new vec2_t(0, 1), to_rad(theta)), -30));
  phys.planes.push(new plane_t(vec2_t.rotate(new vec2_t(-1, 0), to_rad(theta)), -30));
  phys.planes.push(new plane_t(vec2_t.rotate(new vec2_t(0, -1), to_rad(theta)), -30))
}

function load_cloth(phys)
{
  load_planes(phys);
  
  const w = 10;
  const h = 10;
  const l = 2.5;
  
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      phys.circles.push(
        new circle_t(
          new vec2_t(l * j, l * i),
          new vec2_t(0, 0),
          1.0,
          0.0, 1.0));
    }
  }
  
  for (let i = 0; i < w - 1; i++) {
    phys.dynamic_constraints.push(new constraint_t(phys.circles[(w - 1) + i * h], phys.circles[(w - 1) + (i + 1) * h], l));
  }
  
  for (let i = 0; i < h - 1; i++) {
    phys.dynamic_constraints.push(new constraint_t(phys.circles[i + (h - 1) * h], phys.circles[(i + 1) + (h - 1) * h], l));
  }
  
  for (let i = 0; i < h - 1; i++) {
    for (let j = 0; j < w - 1; j++) {
      phys.dynamic_constraints.push(new constraint_t(phys.circles[j + i * h], phys.circles[(j + 1) + i * h], l));
      phys.dynamic_constraints.push(new constraint_t(phys.circles[j + i * h], phys.circles[j + (i + 1) * h], l));
    }
  }
  
  phys.circles.push(
    new circle_t(
      new vec2_t(rand() * 20, rand() * 20),
      new vec2_t(0, 0),
      10.0,
      0.5, 4.0));
}

function load_capsule(phys)
{
  load_planes(phys);
  
  for (let i = 0; i < 15; i++) {
    const a = new capsule_t(
      new vec2_t(rand() * 20, rand() * 20),
      new vec2_t(0, 0), 0.0,
      1.0, 1.0, 0.0,
      new vec2_t(0, 1.0), 1.0);
    
    const b = new capsule_t(
      new vec2_t(rand() * 20, rand() * 20),
      new vec2_t(0, 0), 0.0,
      1.0, 1.0, 0.0,
      new vec2_t(0, 1.0), 1.0);
    
    const c = new capsule_t(
      new vec2_t(rand() * 20, rand() * 20),
      new vec2_t(0, 0), 0.0,
      1.0, 1.0, 0.0,
      new vec2_t(0, 1.0), 1.0);
    
    phys.dynamic_constraints.push(new constraint_t(a, b, 4));
    phys.dynamic_constraints.push(new constraint_t(b, c, 4));
    phys.dynamic_constraints.push(new constraint_t(c, a, 4));
    
    phys.capsules.push(a);
    phys.capsules.push(b);
    phys.capsules.push(c);
  }
}

function main()
{
  let phys = new phys_t();
  
  load_capsule(phys);
  
  let mouse_x;
  let mouse_y;
  let obj = null;
  
  document.getElementById("boom").addEventListener("click", function(e) {
    const boom = 1000;
    
    for (const circle of phys.circles) {
      circle.vel = vec2_t.add(circle.vel, new vec2_t(rand() * boom, rand() * boom));
    }
    
    for (const capsule of phys.capsules) {
      capsule.vel = vec2_t.add(capsule.vel, new vec2_t(rand() * boom, rand() * boom));
    }

  });
  
  document.getElementById("gravity").addEventListener("click", function() {
    phys.gravity = !phys.gravity;
  });
  
  document.getElementById("capsule_demo").addEventListener("click", function() {
    phys = new phys_t();
    phys.gravity = document.getElementById("gravity").checked;
    load_capsule(phys);
  });
  
  document.getElementById("cloth_demo").addEventListener("click", function() {
    phys = new phys_t();
    phys.gravity = document.getElementById("gravity").checked;
    load_cloth(phys);
  });
  
  document.addEventListener("mousemove", function(e) {
    const c = document.getElementById("canvas");
    mouse_x = (e.offsetX - c.width / 2) / 10.0;
    mouse_y = (-e.offsetY + c.height / 2) / 10.0;
  });
  
  document.addEventListener("mousedown", function(e) {
    for (const circle of phys.circles) {
      const d = vec2_t.sub(new vec2_t(mouse_x, mouse_y), circle.pos);
      if (vec2_t.dot(d, d) < 2.0)
        obj = circle;
    }
    
    for (const capsule of phys.capsules) {
      const d = vec2_t.sub(new vec2_t(mouse_x, mouse_y), capsule.pos);
      if (vec2_t.dot(d, d) < 2.0)
        obj = capsule;
    }
  });
  
  document.addEventListener("mouseup", function(e) {
    obj = null;
  });
  
  setInterval(function() {
    if (obj) {
      const delta = vec2_t.sub(new vec2_t(mouse_x, mouse_y), obj.pos);
      obj.vel = vec2_t.add(obj.vel, vec2_t.mulf(delta, 0.5));
    }
    
    frame(phys);
    
    d_circle(new vec2_t(mouse_x, mouse_y), 0.5);
  }, PHYS_DT * 1000);
}

main();
