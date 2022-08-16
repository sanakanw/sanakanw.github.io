"use strict";

import * as THREE from "three";
import { Plane } from "./dr_math.js";

const TIMESTEP = 0.015;

class state_t {
  constructor(pos, dir, vel, slip_angle)
  {
    this.pos = pos;
    this.dir = dir;
    this.vel = vel;
    this.slip_angle = slip_angle;
  }
};

export class car_t {
  pos;
  wheel_dir;
  dir;
  vel;
  force;
  ang_vel;
  is_brake;
  slip_angle;
  mesh;
  clip_seg_id;
  replay_states;
  
  constructor()
  {
    this.pos = new THREE.Vector3();
    this.wheel_dir = 0.0;
    this.dir = new THREE.Vector3(0, 0, 1);
    this.vel = new THREE.Vector3();
    this.force = new THREE.Vector3();
    this.ang_vel = 0.0;
    this.is_brake = false;
    this.slip_angle = 0;
    this.mesh = null;
    
    this.clip_seg_id = -1;
    this.prev_seg_id = -1;
    this.lap_sum = 0;
    this.laps = [];
    this.start_time = new Date();
    
    this.replay_states = [];
    this.replay_frame = 0;
    
    this.time_label = document.getElementById("time");
    this.run_time_label = document.getElementById("run_time");
    this.lap_time_label = document.getElementById("lap_time");
    
    this.headlight = null;
    
    this.snd_tire = null;
    this.snd_tire_count = 0;
    this.snd_tire_tick = 0;
  }
  
  set_map(map_name)
  {
    this.lap_time_label.innerHTML = "LAP 1/3";
    this.run_time_label.innerHTML = map_name + "<br>";
  }
  
  reset()
  {
    this.pos = new THREE.Vector3();
    this.wheel_dir = 0.0;
    this.dir = new THREE.Vector3(0, 0, 1);
    this.vel = new THREE.Vector3();
    this.force = new THREE.Vector3();
    this.ang_vel = 0.0;
    this.is_brake = false;
    this.slip_angle = 0;
    
    this.clip_seg_id = -1;
    this.prev_seg_id = -1;
    this.lap_sum = 0;
    this.laps = [];
    this.start_time = new Date();
    
    this.replay_states = [];
    this.replay_frame = 0;

    this.snd_tire.setVolume(0);
  }
  
  update(map)
  {
    this.wheel_reset();
    this.wheel_forces();
    this.clip_map(map);
    this.integrate();
    
    this.update_snd();
    this.update_mesh();
  }
  
  replay()
  {
    const replay_state = this.replay_states[this.replay_frame % this.replay_states.length]; 
    this.pos.copy(replay_state.pos);
    this.dir.copy(replay_state.dir);
    this.vel.copy(replay_state.vel);
    this.slip_angle = replay_state.slip_angle;
    this.replay_frame++;
  }
  
  record()
  {
    this.replay_states.push(new state_t(this.pos.clone(), this.dir.clone(), this.vel.clone(), this.slip_angle));
  }
  
  track(map)
  {
    if (this.laps.length == 3)
      return true;
    
    const elapsed_time = new Date() - this.start_time;
    this.time_label.innerHTML = format_time(elapsed_time);
    
    if (this.clip_seg_id != this.prev_seg_id) {
      let d_seg = this.clip_seg_id - this.prev_seg_id;
      if (d_seg > map.segments.length / 2)
        d_seg = -this.prev_seg_id - 1;
      else if (d_seg < -map.segments.length / 2)
        d_seg = map.segments.length - 1 + d_seg;
      this.lap_sum += d_seg;
      
      if (this.lap_sum == map.segments.length) {
        this.laps.push(elapsed_time);
        
        if (this.laps.length == 3) {
          this.lap_time_label.innerHTML += format_time(this.laps[2] - this.laps[1]);
          this.run_time_label.innerHTML += format_time(elapsed_time) + "<br>";
        } else {
          this.lap_time_label.innerHTML = "LAP " + (this.laps.length + 1) + "/3<br>";
          let prev_lap = 0;
          for (const lap of this.laps) {
            this.lap_time_label.innerHTML += format_time(lap - prev_lap) + "<br>";
            prev_lap = lap;
          }
        }
        
        this.lap_sum -= map.segments.length;
      }
      
      this.prev_seg_id = this.clip_seg_id;
    }
    
    return false;
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
    const r_grip = this.is_brake ? 0.65 * 2.0 / 3.0 : 0.65;
    
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
    
    this.slip_angle = Math.abs(r_slip_angle);
  }
  
  integrate()
  {
    this.dir.applyEuler(new THREE.Euler(0, this.ang_vel * TIMESTEP, 0));
    this.vel.add(this.force.clone().multiplyScalar(TIMESTEP));
    this.pos.add(this.vel.clone().multiplyScalar(TIMESTEP));
  }
  
  clip_map(map)
  {
    if (this.clip_seg_id == -1) {
      for (let i = 0; i < map.segments.length - 1; i++) {
        if (map.check_point(i, this.pos))
          this.clip_seg_id = i;
      }
    } else {
      const segs_behind = this.clip_seg_id;
      const segs_ahead = map.segments.length - this.clip_seg_id;
      
      const max_segs = Math.max(segs_behind, segs_ahead);
      
      const segment_id = this.clip_seg_id
      
      this.clip_seg_id = -1;
      for (let i = 0; i < max_segs; i++) {
        const behind_id = segment_id - i < 0 ? map.segments.length - i : segment_id - i;
        const ahead_id = (segment_id + i) % map.segments.length;
        
        if (map.check_point(behind_id, this.pos)) {
          this.clip_seg_id = behind_id;
          break;
        }
        
        if (map.check_point(ahead_id, this.pos)) {
          this.clip_seg_id = ahead_id;
          break;
        }
      }
    }
    
    if (this.clip_seg_id != -1) {
      const segment = map.segments[this.clip_seg_id];
      
      const new_pos = this.pos.clone().add(this.vel.clone().multiplyScalar(TIMESTEP));
      
      const clip_side_a = segment.side_a.projectVector3(new_pos) - 0.5;
      const clip_side_b = segment.side_b.projectVector3(new_pos) - 0.5;
      
      if (clip_side_a < 0) {
        const fix = -(this.vel.dot(segment.side_a.normal) + 0.2 * clip_side_a / TIMESTEP);
        this.vel.add(segment.side_a.normal.clone().multiplyScalar(fix));
      }
      
      if (clip_side_b < 0) {
        const fix = -(this.vel.dot(segment.side_b.normal) + 0.2 * clip_side_b / TIMESTEP);
        this.vel.add(segment.side_b.normal.clone().multiplyScalar(fix));
      }
    }
  }
  
  init_mesh(scene, loader, on_finish)
  {
    this.headlight = new THREE.SpotLight(0xffff99, 20.0, 50.0);
    scene.add(this.headlight, this.headlight.target);
    loader.load("assets/ae86/untitled.glb", (gltf) => {
      this.mesh = gltf.scene;
      scene.add(this.mesh);
      on_finish();
    }, undefined, function (error) {
      console.error(error);
    });
  }
  
  update_mesh()
  {
    if (this.headlight) {
      const car_dir = this.dir.clone().multiplyScalar(2);
      const car_front = this.pos.clone().add(car_dir).setY(0.5);
      this.headlight.position.copy(car_front);
      this.headlight.target.position.copy(car_front.clone().add(car_dir));
      this.headlight.target.updateMatrix();
    }
    
    if (this.mesh) {
      const axis = new THREE.Vector3(0, 0, 1);
      
      this.mesh.position.copy(this.pos);
      this.mesh.quaternion.setFromUnitVectors(axis, this.dir);
    }
  }
  
  init_snd(listener, on_finish)
  {
    const audio_loader = new THREE.AudioLoader();
    audio_loader.load("assets/tire.ogg", (buffer) => {
      this.snd_tire = new THREE.Audio(listener);
      this.snd_tire.setBuffer(buffer);
      this.mesh.add(this.snd_tire);
      on_finish();
    });
  }
  
  update_snd()
  {
    if (this.slip_angle > 0.4 && this.vel.length() > 10) {
      if (!this.snd_tire.isPlaying) {
        this.snd_tire.play();
        this.snd_tire.gain.gain.exponentialRampToValueAtTime(0.001, 0.05);
      }
      
      const lerp = (this.slip_angle - 0.4) / 0.6;
      this.snd_tire.setVolume(lerp * 0.5);
    }
  }
  
};

function clamp(a, b, c)
{
  return Math.min(Math.max(a, b), c);
}

function format_time(elapsed_time)
{
  const minutes = Math.floor(elapsed_time / 60000) % 10;
  const seconds = Math.floor(elapsed_time / 1000) % 60;
  const miliseconds = Math.floor(elapsed_time / 10) % 100;
  
  return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + ":" + miliseconds.toString().padStart(2, "0");
}
