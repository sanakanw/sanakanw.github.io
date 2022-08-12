"use strict";

import { rand, vec2_t } from "./math.js";

export class map_t {
  constructor(car)
  {
    this.car = car;
    this.turns = [];
    
    this.turns.push(new vec2_t());
    
    const theta = 100;
    let dir = new vec2_t(0, 60);
    for (let i = 0; i < 50; i++) {
      this.turns.push(vec2_t.add(this.turns[i], dir));
      dir = vec2_t.rotate(dir, rand() * theta * Math.PI / 180.0);
    }
  }
  
  draw3d(draw3d, camera)
  {
    const ROAD_WIDTH = 10;
    
    const side_begin = vec2_t.cross_up(vec2_t.normalize(vec2_t.sub(this.turns[1], this.turns[0])), ROAD_WIDTH);
    
    let old_left = side_begin;
    let old_right = vec2_t.mulf(side_begin, -1);
    
    for (let i = 1; i < this.turns.length; i++) {
      const a = this.turns[i - 1];
      const b = this.turns[i % this.turns.length];
      
      const side = vec2_t.cross_up(vec2_t.normalize(vec2_t.sub(b, a)), ROAD_WIDTH);
      
      const a_left = old_left;
      const a_right = old_right;
      
      const b_left = vec2_t.add(b, side);
      const b_right = vec2_t.sub(b, side);
      
      draw3d.line(a_left, b_left);
      draw3d.line(a_right, b_right);
      
      old_left = b_left;
      old_right = b_right;
    }
  }
}

