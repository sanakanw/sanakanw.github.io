"use strict";

import * as THREE from "three";

const TIMESTEP = 0.015;

export class car_t {
  pos;
  wheel_dir;
  dir;
  vel;
  force;
  ang_vel;
  is_brake;
  grip_loss;
  mesh;
  
  constructor()
  {
    this.pos = new THREE.Vector3();
    this.wheel_dir = 0.0;
    this.dir = new THREE.Vector3(0, 0, 1);
    this.vel = new THREE.Vector3();
    this.force = new THREE.Vector3();
    this.ang_vel = 0.0;
    this.is_brake = false;
    this.grip_loss = false;
    this.mesh = null;
  }
  
  reset_forces()
  {
    this.force.x = 0;
    this.force.y = 0;
    this.force.z = 0;
  }
  
  accel(amount)
  {
    const f_accel = this.dir.clone().multiplyScalar(amount);
    this.force.add(f_accel);
  }
  
  brake(is_brake)
  {
    this.is_brake = is_brake;
  }
  
  steer(w)
  {
    this.wheel_dir = w;
  }
  
  wheel_reset()
  {
    this.wheel_dir -= this.wheel_dir * 8 * TIMESTEP;
  }
  
  drag()
  {
    const C = 0.01;
    const f_drag = this.vel.clone().multiplyScalar(-this.vel.length() * C);
    this.force.add(f_drag);
  }
  
  wheel_forces()
  {
    const C_lat = 0.7;
    const C_long = 0.01;
    
    const f_grip = 0.65;
    const r_grip = this.is_brake ? 0.65 / 2.0 : 0.65;
    
    const r_r = this.dir.clone().multiplyScalar(-1);
    const r_vel = this.vel.clone().add(r_r.clone().cross(new THREE.Vector3(0, -this.ang_vel, 0)));
    const r_spd = r_vel.length();
    const r_normal = this.dir;
    const r_tangent = r_normal.clone().cross(new THREE.Vector3(0, 1, 0));
    const r_slip_angle = r_tangent.dot(r_vel.clone().normalize());
    const r_alpha = clamp(r_slip_angle, -r_grip, r_grip) * r_spd;
    const r_beta = r_normal.dot(r_vel);
    const r_f_lateral = r_tangent.clone().multiplyScalar(-C_lat * r_alpha);
    const r_f_longtitudinal = r_normal.clone().multiplyScalar(-C_long * r_beta);
    
    const f_r = this.dir.clone();
    const f_vel = this.vel.clone().add(f_r.clone().cross(new THREE.Vector3(0, -this.ang_vel, 0)));
    const f_spd = f_vel.length();
    const f_normal = this.dir.clone().applyEuler(new THREE.Euler(0, this.wheel_dir, 0));
    const f_tangent = f_normal.clone().cross(new THREE.Vector3(0, 1, 0));
    const f_slip_angle = f_tangent.dot(f_vel.clone().normalize());
    const f_alpha = clamp(f_slip_angle, -f_grip, f_grip) * f_spd;
    const f_beta = f_normal.dot(f_vel);
    const f_f_lateral = f_tangent.clone().multiplyScalar(-C_lat * f_alpha);
    const f_f_longtitudinal = f_normal.clone().multiplyScalar(-C_long * f_beta);
    
    const r_f_net = r_f_lateral.clone().add(r_f_longtitudinal);
    const f_f_net = f_f_lateral.clone().add(f_f_longtitudinal);
    
    const f_net = r_f_net.clone().add(f_f_net);
    
    const I = 0.55;
    const r_I = I;
    const f_I = I;
    
    const ang_accel = r_I * r_r.clone().cross(r_f_net).y + f_I * f_r.clone().cross(f_f_net).y;
    
    this.ang_vel += ang_accel * TIMESTEP;
    this.force.add(f_net);
    
    this.grip_loss = r_slip_angle;
  }
  
  integrate()
  {
    this.dir.applyEuler(new THREE.Euler(0, this.ang_vel * TIMESTEP, 0));
    this.vel.add(this.force.clone().multiplyScalar(TIMESTEP));
    this.pos.add(this.vel.clone().multiplyScalar(TIMESTEP));
  }
  
  init_mesh(scene, loader)
  {
    loader.load("assets/ae86/scene.glb", (gltf) => {
      this.mesh = gltf.scene;
      scene.add(this.mesh);
    }, undefined, function (error) {
      console.error(error);
    });
  }
  
  update_mesh()
  {
    if (this.mesh) {
      const axis = new THREE.Vector3(0, 0, 1);
      
      this.mesh.position.copy(this.pos);
      this.mesh.quaternion.setFromUnitVectors(axis, this.dir);
    }
  }
};

function clamp(a, b, c)
{
  return Math.min(Math.max(a, b), c);
}
