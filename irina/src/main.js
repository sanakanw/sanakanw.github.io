"use strict";

import { vec2_t } from "./math.js";
import { draw_t } from "./draw.js";
import { input_t } from "./input.js";

const TIMESTEP = 0.015;

const draw = new draw_t(document.getElementById("display"));
const input = new input_t(document.getElementById("display"));

class car_t {
  constructor(pos)
  {
    this.pos = pos;
    this.wheel_dir = 0.0;
    this.dir = vec2_t.rotate(new vec2_t(0, 1), 0.0);
    this.vel = new vec2_t(0, 0);
    this.force = new vec2_t();
    this.ang_vel = 0;
  }
  
  reset_forces()
  {
    this.force = new vec2_t(0, 0);
  }
  
  accel(amount)
  {
    const f_accel = vec2_t.mulf(this.dir, amount);
    this.force = vec2_t.add(this.force, f_accel);
  }
  
  steer(w)
  {
    this.wheel_dir += w;
  }
  
  wheel_reset()
  {
    this.wheel_dir -= this.wheel_dir * 4 * TIMESTEP;
  }
  
  drag()
  {
    const C = 0.01;
    const v_len = vec2_t.length(this.vel);
    const f_drag = vec2_t.mulf(this.vel, -v_len * C);
    this.force = vec2_t.add(this.force, f_drag);
  }
  
  wheel_forces()
  {
    const is_brake = input.get_key(" ");
    
    const C_lat = 1.0;
    const C_long = 0.02;
    const r_C_long = is_brake ? (C_long + 0.3) : C_long;
    
    const r_r = vec2_t.mulf(this.dir, -1);
    const r_vel = vec2_t.add(this.vel, vec2_t.cross_up(r_r, this.ang_vel));
    const r_normal = this.dir;
    const r_tangent = vec2_t.cross_up(r_normal, 1);
    const r_alpha = vec2_t.dot(r_tangent, r_vel);
    const r_beta = vec2_t.dot(r_normal, r_vel);
    const r_f_lateral = vec2_t.mulf(r_tangent, -C_lat * r_alpha);
    const r_f_longtitudinal = vec2_t.mulf(r_normal, -r_C_long * r_beta);
    
    const f_r = this.dir;
    const f_vel = vec2_t.add(this.vel, vec2_t.cross_up(f_r, this.ang_vel));
    const f_normal = vec2_t.rotate(this.dir, this.wheel_dir);
    const f_tangent = vec2_t.cross_up(f_normal, 1);
    const f_alpha = vec2_t.dot(f_tangent, f_vel);
    const f_beta = vec2_t.dot(f_normal, r_vel);
    const f_f_lateral = vec2_t.mulf(f_tangent, -C_lat * f_alpha);
    const f_f_longtitudinal = vec2_t.mulf(f_normal, -C_long * f_beta);
    
    const f_cornering = vec2_t.add(r_f_lateral, f_f_lateral);
    const f_friction = vec2_t.add(r_f_longtitudinal, f_f_longtitudinal);
    const f_net = vec2_t.add(f_cornering, f_friction);
    
    const a = vec2_t.length(r_f_lateral);
    const I = 0.5;
    const r_I = is_brake ? (I) : I;
    const f_I = is_brake ? (I + a * 0.006) : I + a * 0.001;
    
    const ang_accel = r_I * vec2_t.cross(r_r, r_f_lateral) + f_I * vec2_t.cross(f_r, f_f_lateral);
    
    this.ang_vel += ang_accel * TIMESTEP;
    this.force = vec2_t.add(this.force, f_net);
  }
  
  draw()
  {
    const p1 = vec2_t.sub(new vec2_t(), this.dir);
    const p2 = vec2_t.add(new vec2_t(), this.dir);
    
    const wheel = vec2_t.rotate(this.dir, this.wheel_dir);
    const p3 = vec2_t.sub(p2, vec2_t.mulf(wheel, 0.5));
    const p4 = vec2_t.add(p2, vec2_t.mulf(wheel, 0.5));
    
    draw.line(p1, p2);
    draw.line(p3, p4);
    draw.circle(p2, 0.1);
    
    draw.circle(vec2_t.sub(new vec2_t(), this.pos), 5);
    
    const gs = 5;
    
    for (let i = -30; i < 30; i += gs) {
      for (let j = -30; j < 30; j += gs) {
        const shift = new vec2_t(
          this.pos.x - Math.floor(this.pos.x / gs) * gs,
          this.pos.y - Math.floor(this.pos.y / gs) * gs
        );
        draw.circle(vec2_t.sub(new vec2_t(i, j), shift), 0.1);
      }
    }
  }
  
  bound()
  {
    const b = 30;
    if (this.pos.x < -b)
      this.pos.x = b;
    if (this.pos.x > b)
      this.pos.x = -b;
    if (this.pos.y < -b)
      this.pos.y = b;
    if (this.pos.y > b)
      this.pos.y = -b;
  }
  
  integrate()
  {
    this.dir = vec2_t.rotate(this.dir, this.ang_vel * TIMESTEP);
    this.vel = vec2_t.add(this.vel, vec2_t.mulf(this.force, TIMESTEP));
    this.pos = vec2_t.add(this.pos, vec2_t.mulf(this.vel, TIMESTEP));
  }
};

function main()
{
  const car = new car_t(new vec2_t(0, -10));
  
  setInterval(function() {
    draw.clear();
    
    car.reset_forces();
    
    if (input.get_key("W"))
      car.accel(30);
    if (input.get_key("A"))
      car.steer(0.04);
    if (input.get_key("D"))
      car.steer(-0.04);
    
    car.wheel_reset();
    
    car.bound();
    
    car.drag();
    car.wheel_forces();
    car.integrate();
    
    car.draw();
  }, TIMESTEP * 1000);
}

main();
