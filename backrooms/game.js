"use strict";

import { vec2_t } from "./math.js";

const g_deltatime = 1.0 / 60.0;

class camera_t {
  constructor(pos = new vec2_t(), rot = 0.0)
  {
    this.pos = pos;
    this.rot = rot;
  }
};

class player_t {
  constructor(pos, rot)
  {
    this.pos = pos;
    this.vel = new vec2_t();
    this.rot = rot;
  }
};

export class game_t {
  constructor(client)
  {
    this.unprocessed_ms = 0;
    
    this.client = client;
    this.camera = new camera_t();
    this.player = new player_t(new vec2_t(2.5, 2.5), 0.0);
  }
  
  new_map(map)
  {
    this.map = map;
  }
  
  update(dt)
  {
    this.unprocessed_ms += dt;
    
    while (this.unprocessed_ms >= g_deltatime * 1000.0) {
      this.unprocessed_ms -= g_deltatime * 1000.0;
      this.fixed_update();
    }
  }
  
  fixed_update()
  {
    this.player_look();
    this.player_move();
    
    this.player_clip_map();
    
    this.apply_player_velocity();
    
    this.lock_camera_to_player();
  }
  
  player_look()
  {
    const sensitivity = 0.0015;
    this.player.rot = this.client.get_rot() * sensitivity;
  }
  
  player_move()
  {
    const cmd_dir = new vec2_t(this.client.get_right(), this.client.get_forward());
    
    if (cmd_dir.x || cmd_dir.y) {
      const wish_dir = cmd_dir.normalize().rotate(this.player.rot);
      
      this.player.vel.x = wish_dir.x * 3;
      this.player.vel.y = wish_dir.y * 3;
    } else {
      this.player.vel.x = 0;
      this.player.vel.y = 0;
    }
  }
  
  player_clip_map()
  {
    const xdelta = this.player.pos.x + this.player.vel.x * g_deltatime;
    const ydelta = this.player.pos.y + this.player.vel.y * g_deltatime;
    
    if (this.map.collide(xdelta, ydelta)) {
      if (!this.map.collide(xdelta, this.player.pos.y)) {
        this.player.vel.y = 0;
      } else if (!this.map.collide(this.player.pos.x, ydelta)) {
        this.player.vel.x = 0;
      } else {
        this.player.vel.x = 0;
        this.player.vel.y = 0;
      }
    }
  }
  
  apply_player_velocity()
  {
    this.player.pos.x += this.player.vel.x * g_deltatime;
    this.player.pos.y += this.player.vel.y * g_deltatime;
  }
  
  lock_camera_to_player()
  {
    this.camera.pos.x = this.player.pos.x;
    this.camera.pos.y = this.player.pos.y;
    this.camera.rot = this.player.rot;
  }
};
