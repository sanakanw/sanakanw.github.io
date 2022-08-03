"use strict";

import { display_t } from "./display.js";
import { texture_load } from "./texture.js";

const bmp_wall = [
  0xffffffff, 0xff000000, 0xffffffff, 0xff000000,
  0xff000000, 0xffffffff, 0xff000000, 0xffffffff,
  0xffffffff, 0xff000000, 0xffffffff, 0xff000000,
  0xff000000, 0xffffffff, 0xff000000, 0xffffffff
];

class rect_align {
  static BOTTOM_CENTER  = 0;
  static BOTTOM_LEFT    = 1;
};

function draw_rect(display, align, tex, xc, yc, w, h)
{
  let x0, x1, y0, y1;
  switch (align) {
  case rect_align.BOTTOM_CENTER:
    x0 = xc - w / 2.0;
    x1 = xc + w / 2.0;
    y0 = yc - h;
    y1 = yc;
    break;
  case rect_align.BOTTOM_LEFT:
    x0 = xc;
    x1 = xc + w;
    y0 = yc - h;
    y1 = yc;
    break;
  }
  
  const xp0 = Math.floor(x0);
  const xp1 = Math.floor(x1);
  const yp0 = Math.floor(y0);
  const yp1 = Math.floor(y1);
  
  for (let yp = yp0; yp < yp1; yp++) {
    const yt = Math.floor(tex.width * (yp - yp0) / (yp1 - yp0));
    for (let xp = xp0; xp < xp1; xp++) {
      const xt = Math.floor(tex.width * (xp - xp0) / (xp1 - xp0));
      
      const color = tex.get_rgb(xt, yt);
      if (color[0] < 240 || color[1] > 15 || color[2] < 240)
        display.put_pixel_rgb(color, xp, yp);
    }
  }
}

export class renderer_t {
  constructor(game, display)
  {
    this.game = game;
    this.display = display;
    this.tex_wall = texture_load("wall.png");
    this.tex_floor = texture_load("floor.png");
    this.tex_ceil = texture_load("ceil.png");
    this.tex_gun = texture_load("gun.png");
    this.tex_gun_attack = texture_load("gun_attack.png");
    this.tex_moom = [
      texture_load("moom.png"),
      texture_load("moom_1.png"),
      texture_load("moom_2.png"),
      texture_load("moom_3.png"),
    ];
    this.tex_friend = texture_load("friend.png");
    this.zbuffer = new Float32Array(this.display.width);
  }
  
  new_map(map)
  {
    this.map = map;
  }
  
  render()
  {
    this.render_map();
    this.render_friends();
    this.render_status();
    this.render_gun();
    this.display.swap();
  }
  
  render_friends()
  {
    for (const friend of this.game.friends)
      this.render_sprite(this.tex_friend, friend.pos.x, friend.pos.y);
  }
  
  render_status()
  {
    const moom_status = this.game.player.hp;
    
    draw_rect(
      this.display,
      rect_align.BOTTOM_LEFT,
      this.tex_moom[this.tex_moom.length - moom_status],
      3, this.display.height - 2,
      60, 60);
  }
  
  render_sprite(tex, xpos, ypos)
  {
    const half_width = this.display.width / 2;
    const half_height = this.display.height / 2;
    
    const cos_dir = Math.cos(-this.game.player.rot);
    const sin_dir = Math.sin(-this.game.player.rot);
    
    const xcam = xpos - this.game.player.pos.x;
    const ycam = ypos - this.game.player.pos.y;
    
    const xrot = xcam * cos_dir - ycam * sin_dir;
    const yrot = xcam * sin_dir + ycam * cos_dir;
    
    if (yrot < 0.1)
      return;
    
    const fov_theta = 90;
    
    const view_fov = Math.tan(fov_theta / 2.0 * Math.PI / 180.0) * 2.0;
    const fov = this.display.width / view_fov;
    const half_fov = fov / 2;
    const inverse_fov = 1 / fov;
    
    const inverse_yrot = 1.0 / yrot;
    
    const xpixel = xrot * inverse_yrot * fov + half_width;
    const ypixel = half_height;
    
    const spr_size = fov * inverse_yrot * 0.5;
    
    const xpixel0 = xpixel - spr_size;
    const xpixel1 = xpixel + spr_size;
    
    const ypixel0 = ypixel - spr_size;
    const ypixel1 = ypixel + spr_size;
    
    const xp0 = Math.ceil(xpixel0);
    const xp1 = Math.ceil(xpixel1);
    
    const yp0 = Math.ceil(ypixel0);
    const yp1 = Math.ceil(ypixel1);
    
    const brightness = Math.min(1.0 / yrot, 1.0);
    
    for (let x = xp0; x < xp1; x++) {
      if (this.zbuffer[x] < yrot)
        continue;
      
      this.zbuffer[x] = yrot; 
      
      const xt = Math.floor(tex.width * (x - xp0) / (xp1 - xp0));
      
      for (let y = yp0; y < yp1; y++) {
        const yt = Math.floor(tex.height * (y - yp0) / (yp1 - yp0));
        
        const color = tex.get_rgb(xt, yt);
        
        if (color[0] > 240 && color[1] < 15 && color[2] > 240)
          continue;
        
        const new_color = [
          Math.floor(color[0] * brightness),
          Math.floor(color[1] * brightness),
          Math.floor(color[2] * brightness)
        ];
        
        this.display.put_pixel_rgb(new_color, x, y);
      }
    }
  }
  
  render_gun()
  {
    let tex = this.tex_gun;
    const anim = this.game.player.next_attack - this.game.time;
    if (anim > 0.0 && anim > 0.75) {
      tex = this.tex_gun_attack;
    }
    
    draw_rect(
      this.display,
      rect_align.BOTTOM_CENTER,
      tex,
      this.display.width / 2, this.display.height,
      60, 60);
  }
  
  render_map()
  {
    const half_width = this.display.width / 2;
    const half_height = this.display.height / 2;
    
    const cos_dir = Math.cos(this.game.player.rot);
    const sin_dir = Math.sin(this.game.player.rot); 
    
    const aspect_ratio = this.display.width / this.display.height;
    
    const fov_theta = 90;
    
    const view_fov = Math.tan(fov_theta / 2.0 * Math.PI / 180.0) * 2.0;
    const fov = this.display.width / view_fov;
    const half_fov = fov / 2;
    const inverse_fov = 1 / fov;
    
    for (let x = 0; x < this.display.width; x++) {
      const xplayer = (x - half_width) * inverse_fov;
      
      const xraydir = xplayer * cos_dir - sin_dir;
      const yraydir = xplayer * sin_dir + cos_dir;
      
      const xdeltadist = Math.abs(1.0 / xraydir);
      const ydeltadist = Math.abs(1.0 / yraydir);
      
      let xmap = Math.floor(this.game.player.pos.x);
      let ymap = Math.floor(this.game.player.pos.y);
      
      let xstep, ystep;
      let xsidedist, ysidedist;
      
      if (xraydir < 0) {
        xsidedist = (this.game.player.pos.x - xmap) * xdeltadist;
        xstep = -1;
      } else {
        xsidedist = (xmap + 1 - this.game.player.pos.x) * xdeltadist;
        xstep = +1;
      }
      
      if (yraydir < 0) {
        ysidedist = (this.game.player.pos.y - ymap) * ydeltadist;
        ystep = -1;
      } else {
        ysidedist = (ymap + 1 - this.game.player.pos.y) * ydeltadist;
        ystep = +1;
      }
      
      let side = false;
      while (this.map.get(xmap, ymap) == 0) {
        if (xsidedist < ysidedist) {
          xsidedist += xdeltadist;
          xmap += xstep;
          side = true;
        } else {
          ysidedist += ydeltadist;
          ymap += ystep;
          side = false;
        }
      }
      
      let walldist, xwall;
      if (side) {
        walldist = xsidedist - xdeltadist;
        xwall = Math.abs(this.game.player.pos.y + walldist * yraydir - ymap);
      } else {
        walldist = ysidedist - ydeltadist;
        xwall = Math.abs(this.game.player.pos.x + walldist * xraydir - xmap);
      }
      
      this.zbuffer[x] = walldist;
      
      const xtex = Math.min(Math.floor(xwall * this.tex_wall.width), this.tex_wall.width - 1);
      
      const inverse_walldist = 1.0 / walldist;
      const wallheight = Math.ceil(inverse_walldist * half_fov);
      
      const ystart = half_height - wallheight;
      const yend = half_height + wallheight;
      
      for (let y = 0; y < this.display.height; y++) {
        if (y > ystart && y < yend) {
          const ytex = Math.floor(this.tex_wall.height * (y - ystart) / (2 * wallheight));
          const color = this.tex_wall.get_rgb(xtex, ytex);
          
          const brightness = Math.min(inverse_walldist, 1.0);
          
          const new_color = [
            Math.floor(color[0] * brightness),
            Math.floor(color[1] * brightness),
            Math.floor(color[2] * brightness)
          ];
          
          this.display.put_pixel_rgb(new_color, x, y);
        } else {
          const i = (y - half_height) * inverse_fov;
          const zd = Math.abs(0.5 / i);
          
          const xd = xplayer * zd;
          
          const x_pixel = xd * cos_dir - zd * sin_dir + this.game.player.pos.x;
          const y_pixel = xd * sin_dir + zd * cos_dir + this.game.player.pos.y;
          
          const xp = Math.floor(x_pixel * this.tex_floor.width) & (this.tex_floor.width - 1);
          const yp = Math.floor(y_pixel * this.tex_floor.height) & (this.tex_floor.height - 1);
          
          let color;
          if (y < half_height)
            color = this.tex_ceil.get_rgb(xp, yp);
          else
            color = this.tex_floor.get_rgb(xp, yp);
          
          const brightness = Math.min(Math.abs(2 * i), 1.0);
          
          const new_color = [
            Math.floor(color[0] * brightness),
            Math.floor(color[1] * brightness),
            Math.floor(color[2] * brightness)
          ];
          
          this.display.put_pixel_rgb(new_color, x, y);
        }
      }
    }
  }
}
