"use strict";

import { vec2_t } from "./math.js";
import { sound_t } from "./sound.js";

const TIMESTEP = 1.0 / 60.0;

class player_t {
  constructor(pos, rot)
  {
    this.pos = pos;
    this.vel = new vec2_t(0.0, 0.0);
    this.rot = rot;
    this.hp = 4;
    this.next_attack = 0;
    this.score = 0;
    this.snd_gun = new sound_t("gun.wav");
  }
  
  look(client)
  {
    const sensitivity = 0.0015;
    this.rot = client.get_rot() * sensitivity;
  }
  
  move(client)
  {
    const cmd_dir = new vec2_t(client.get_right(), client.get_forward());
    
    if (cmd_dir.x || cmd_dir.y) {
      const wish_dir = cmd_dir.normalize().rotate(this.rot);
      
      this.vel.x = wish_dir.x * 3;
      this.vel.y = wish_dir.y * 3;
    } else {
      this.vel.x = 0;
      this.vel.y = 0;
    }
  }
  
  clip_map(map)
  {
    const dx = this.pos.x + this.vel.x * TIMESTEP;
    const dy = this.pos.y + this.vel.y * TIMESTEP;
    
    if (map.collide(dx, dy)) {
      if (!map.collide(dx, this.pos.y)) {
        this.vel.y = 0;
      } else if (!map.collide(this.pos.x, dy)) {
        this.vel.x = 0;
      } else {
        this.vel.x = 0;
        this.vel.y = 0;
      }
    }
  }
  
  apply_velocity()
  {
    this.pos.x += this.vel.x * TIMESTEP;
    this.pos.y += this.vel.y * TIMESTEP;
  }
  
  attack(client, time, friends)
  {
    if (client.get_attack() && time > this.next_attack) {
      this.snd_gun.play();
      
      for (let i = 0; i < friends.length; i++) {
        const delta_pos = this.pos.sub(friends[i].pos);
        const normal = delta_pos.normalize();
        const distance = normal.dot(friends[i].pos);
        const dir = new vec2_t(0, 1).rotate(this.rot);
        if (delta_pos.dot(dir) < 0) {
          const t = -(this.pos.dot(normal) - distance) / dir.dot(normal);
          const hit_pos = this.pos.add(dir.mulf(t));
          const tangent = normal.cross_up();
          const hit_range = hit_pos.dot(tangent) - friends[i].pos.dot(tangent);
          if (Math.abs(hit_range) < 0.4) {
            friends[i].hp--;
            break;
          }
        }
      }
      
      this.next_attack = time + 1.0;
    }
  }
  
  die()
  {
    if (this.hp <= 0) {
      this.hp = 10;
      alert("GAME OVER: SCORE: " + this.score.toString());
      location.reload();
    }
  }
};

export class friend_t {
  constructor(pos)
  {
    this.pos = pos;
    this.hp = 2;
  }
};

export class game_t {
  constructor(client)
  {
    this.lag_time = 0;
    this.time = 0;
    
    this.client = client;
    this.player = new player_t(new vec2_t(2.5, 2.5), 0.0);
    this.friends = [];
    this.snd_dmg = new sound_t("oh.mp3");
  }
  
  new_map(map)
  {
    this.map = map;
  }
  
  update(dt)
  {
    this.lag_time += dt;
    
    while (this.lag_time >= TIMESTEP * 1000.0) {
      this.lag_time -= TIMESTEP * 1000.0;
      this.time += TIMESTEP;
      this.fixed_update();
    }
  }
  
  fixed_update()
  {
    this.player.look(this.client);
    this.player.move(this.client);
    this.player.attack(this.client, this.time, this.friends);
    this.player.clip_map(this.map);
    this.player.apply_velocity();
    
    this.friends_spawn();
    this.friends_follow();
    this.friends_die();
    
    this.player.die();
  }
  
  friends_spawn()
  {
    if (this.friends.length < 10 && this.time > 4.0) {
      const pos = new vec2_t((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
      this.friends.push(new friend_t(pos));
    }
  }
  
  friends_follow()
  {
    for (let i = 0; i < this.friends.length; i++) {
      const delta_pos = this.player.pos.sub(this.friends[i].pos);
      const dir = delta_pos.normalize();
      
      if (delta_pos.length() > 0.7) {
        if (Math.random() > 0.9) {
          const jitter = new vec2_t(Math.random() - 0.5, Math.random() - 0.5).normalize().mulf(0.25);
          this.friends[i].pos = this.friends[i].pos.add(jitter);
        }
        
        this.friends[i].pos = this.friends[i].pos.add(dir.mulf(TIMESTEP));
      } else {
        this.friends.splice(i, 1);
        this.player.hp--;
        this.snd_dmg.play();
      }
    }

  }
  
  friends_die()
  {
    for (let i = 0; i < this.friends.length; i++) {
      if (this.friends[i].hp <= 0) {
        this.friends.splice(i, 1);
        this.player.score++;
      }
    }
  }
  
};
