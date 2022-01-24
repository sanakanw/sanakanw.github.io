"use strict";

import { display_t } from "./display.js";
import { load_texture } from "./texture.js";

const bmp_wall = [
  0xffffffff, 0xff000000, 0xffffffff, 0xff000000,
  0xff000000, 0xffffffff, 0xff000000, 0xffffffff,
  0xffffffff, 0xff000000, 0xffffffff, 0xff000000,
  0xff000000, 0xffffffff, 0xff000000, 0xffffffff
];

export class renderer_t {
  constructor(game, display)
  {
    this.game = game;
    this.display = display;
    this.tex_wall = load_texture("wall.png");
    this.tex_floor = load_texture("floor.png");
    this.tex_ceil = load_texture("ceil.png");
    this.zbuffer = new Float32Array(this.display.width);
  }
  
  new_map(map)
  {
    this.map = map;
  }
  
  render()
  {
    this.render_map();
    this.display.swap();
  }
  
  render_map()
  {
    const half_width = this.display.width / 2;
    const half_height = this.display.height / 2;
    
    const cos_dir = Math.cos(this.game.camera.rot);
    const sin_dir = Math.sin(this.game.camera.rot); 
    
    const aspect_ratio = this.display.width / this.display.height;
    
    const fov_theta = 90;
    
    const view_fov = Math.tan(fov_theta / 2.0 * Math.PI / 180.0) * 2.0;
    const fov = this.display.width / view_fov;
    const half_fov = fov / 2;
    const inverse_fov = 1 / fov;
    
    for (let x = 0; x < this.display.width; x++) {
      const xcamera = (x - half_width) * inverse_fov;
      
      const xraydir = xcamera * cos_dir - sin_dir;
      const yraydir = xcamera * sin_dir + cos_dir;
      
      const xdeltadist = Math.abs(1.0 / xraydir);
      const ydeltadist = Math.abs(1.0 / yraydir);
      
      let xmap = Math.floor(this.game.camera.pos.x);
      let ymap = Math.floor(this.game.camera.pos.y);
      
      let xstep, ystep;
      let xsidedist, ysidedist;
      
      if (xraydir < 0) {
        xsidedist = (this.game.camera.pos.x - xmap) * xdeltadist;
        xstep = -1;
      } else {
        xsidedist = (xmap + 1 - this.game.camera.pos.x) * xdeltadist;
        xstep = +1;
      }
      
      if (yraydir < 0) {
        ysidedist = (this.game.camera.pos.y - ymap) * ydeltadist;
        ystep = -1;
      } else {
        ysidedist = (ymap + 1 - this.game.camera.pos.y) * ydeltadist;
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
        xwall = Math.abs(this.game.camera.pos.y + walldist * yraydir - ymap);
      } else {
        walldist = ysidedist - ydeltadist;
        xwall = Math.abs(this.game.camera.pos.x + walldist * xraydir - xmap);
      }
      
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
          
          const xd = xcamera * zd;
          
          const x_pixel = xd * cos_dir - zd * sin_dir + this.game.camera.pos.x;
          const y_pixel = xd * sin_dir + zd * cos_dir + this.game.camera.pos.y;
          
          const xp = Math.floor(x_pixel * this.tex_floor.width) & (this.tex_floor.width - 1);
          const yp = Math.floor(y_pixel * this.tex_floor.height) & (this.tex_floor.height - 1);
          
          let color;
          if (y < half_height)
            color = this.tex_ceil.get_rgb(xp, yp);
          else
            color = this.tex_floor.get_rgb(xp, yp);
          
          const brightness = Math.min(Math.abs(2 * i), 1.0); // 1.0 / zd
          
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
