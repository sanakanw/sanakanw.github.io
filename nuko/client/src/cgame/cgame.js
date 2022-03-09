"use strict";

import { transform_t } from "./transform.js";
import { motion_t } from "./motion.js";
import { pmove_t } from "./pmove.js";

import { brush_t } from "../common/map.js";
import { bsp_t } from "../common/bsp.js";
import { vec3_t, quat_t, plane_t } from "../common/math.js";

function pmove_accelerate(vel, wish_dir, accel, wish_speed)
{
  const current_speed = vel.dot(wish_dir);
  const add_speed = wish_speed * cgame_t.INVERSE_TIMESTEP - current_speed;
  
  let accel_speed = accel * cgame_t.INVERSE_TIMESTEP;
  
  if (add_speed <= 0)
    accel_speed = 0;
  else if (accel_speed > add_speed)
    accel_speed = add_speed;
  
  return accel_speed;
}

export class cgame_t {
  static TICKRATE = 15;
  static TIMESTEP = cgame_t.TICKRATE / 1000.0;
  static TIMESTEP_SQUARED = cgame_t.TIMESTEP * cgame_t.TIMESTEP;
  static INVERSE_TIMESTEP = 1.0 / cgame_t.TIMESTEP;
  static INVERSE_TIMESTEP_SQUARED = cgame_t.INVERSE_TIMESTEP * cgame_t.INVERSE_TIMESTEP;
  
  constructor()
  {
    this.num_entities = 0;
    
    this.c_transform = {};
    this.c_motion = {};
    this.c_pmove = new pmove_t();
    
    this.player = this.add_entity();
    this.c_motion[this.player] = new motion_t();
    this.c_transform[this.player] = new transform_t();
    
    this.c_transform[this.player].pos.y = 10;
    this.c_motion[this.player].old_pos.y = 10;
    
    this.usercmd = null;
    this.bsp = null;
  }
  
  new_map(map_handle)
  {
    this.bsp = new bsp_t(map_handle);
  }
  
  update()
  {
    this.reset_force();
    this.apply_gravity();
    this.player_look();
    this.player_move();
    this.player_jump();
    this.apply_friction();
    this.clip_map();
    this.integrate_motion();
  }
  
  reset_force()
  {
    for (let i = 0; i < this.num_entities; i++) {
      if (!this.c_motion[i])
        continue;
      
      this.c_motion[i].force = new vec3_t();
    }
  }
  
  apply_gravity()
  {
    const GRAVITY = 14;
    
    for (let i = 0; i < this.num_entities; i++) {
      if (!this.c_motion[i])
        continue;
      
      this.c_motion[i].apply_force(new vec3_t(0, -GRAVITY, 0));
    }
  }
  
  apply_friction()
  {
    const DRAG = 8.0;
    
    for (let i = 0; i < this.num_entities; i++) {
      if (!this.c_motion[i])
        continue;
      
      if (this.c_pmove.grounded) {
        const vel = this.c_transform[this.player].pos.sub(this.c_motion[this.player].old_pos);
        const move_dir = new vec3_t(vel.x, 0, vel.z).normalize();
        const speed = vel.length() * cgame_t.INVERSE_TIMESTEP;
        const lambda = -speed * DRAG;
        
        this.c_motion[i].apply_force(move_dir.mulf(lambda));
      }
    }
  }
  
  player_look()
  {
    const SENSITIVITY = 0.0015;
    
    const up = new vec3_t(0, 1, 0);
    const right = new vec3_t(1, 0, 0);
    
    const rot_yaw = quat_t.init_rotation(up, this.usercmd.yaw * SENSITIVITY);
    
    const axis_pitch = right.rotate(rot_yaw);
    const rot_pitch = quat_t.init_rotation(axis_pitch, this.usercmd.pitch * SENSITIVITY);
    
    this.c_pmove.move_rot = rot_yaw;
    this.c_transform[this.player].rot = rot_pitch.mul(rot_yaw);
  }
  
  player_move()
  {
    const cmd_dir = new vec3_t(this.usercmd.right, 0, this.usercmd.forward);
    const wish_dir = cmd_dir.normalize().rotate(this.c_pmove.move_rot);
    
    const vel = this.c_transform[this.player].pos.sub(this.c_motion[this.player].old_pos).mulf(cgame_t.INVERSE_TIMESTEP_SQUARED);
    
    let accel_speed;
    if (this.c_pmove.grounded)
      accel_speed = pmove_accelerate(vel, wish_dir, 2.0, 6.0);
    else
      accel_speed = pmove_accelerate(vel, wish_dir, 1.2, 1.5);
    
    this.c_motion[this.player].apply_force(wish_dir.mulf(accel_speed));
  }
  
  player_jump()
  {
    if (this.usercmd.jump && this.c_pmove.grounded) {
      this.c_motion[this.player].force = this.c_motion[this.player].force.add(new vec3_t(0, 200, 0));
      this.c_pmove.grounded = false;
    }
  }
  
  integrate_motion()
  {
    for (let i = 0; i < this.num_entities; i++) {
      if (!this.c_transform[i] || !this.c_motion[i])
        continue;
      
      const pos = this.c_transform[i].pos;
      const old_pos = this.c_motion[i].old_pos;
      
      const vel = pos.sub(old_pos);
      const accel = this.c_motion[i].force.mulf(this.c_motion[i].inverse_mass);
      
      const new_pos = pos.add(vel).add(accel.mulf(cgame_t.TIMESTEP_SQUARED));
      
      this.c_motion[i].old_pos = pos;
      this.c_transform[i].pos = new_pos;
    }
  }
  
  clip_map()
  {
    this.c_pmove.grounded = false;
    if (this.bsp)
      this.clip_map_R(this.bsp.root, new plane_t(new vec3_t(0, 1, 0), -100));
  }
  
  clip_map_R(node, min_plane)
  {
    const SPHERE_RADIUS = 0.5;
    const COS_GROUND_INCLINE = Math.cos(45 * Math.PI / 180.0);
    const UP = new vec3_t(0, 1, 0);
    
    if (!node)
      return;
    
    const pos = this.c_transform[this.player].pos;
    
    const dist_from_plane = node.plane.normal.dot(pos) - node.plane.distance - SPHERE_RADIUS;
    
    if (dist_from_plane > -2 * SPHERE_RADIUS)
      this.clip_map_R(node.ahead, min_plane);
    
    if (dist_from_plane < 0) {
      if (dist_from_plane > min_plane.distance)
        min_plane = new plane_t(node.plane.normal, dist_from_plane);
      
      if (node.type == brush_t.BRUSH_SOLID) {
        if (min_plane.normal.dot(UP) > COS_GROUND_INCLINE)
          this.c_pmove.grounded = true;
        
        const fix = min_plane.normal.mulf(-min_plane.distance);
        
        this.c_transform[this.player].pos = this.c_transform[this.player].pos.add(fix);
      }
      
      this.clip_map_R(node.behind, min_plane);
    }
  }
  
  add_entity()
  {
    return this.num_entities++;
  }
  
  recv_cmd(usercmd)
  {
    this.usercmd = usercmd;
  }
}
