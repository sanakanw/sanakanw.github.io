"use strict";

import { Vector2, Vector3 } from "./math.js";
import { Camera } from "./camera.js";
import { inputInit, inputGetKey } from "./input.js";
import { Sprite } from "./sprite.js";

export class Game {
  constructor()
  {
    this.camera = new Camera(new Vector3(0.0, 0.0, 0.0), 0.0);
    this.sprites = [];
    
    inputInit();
  }
  
  newPlayer()
  {
    return this.sprites.push(new Sprite(new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), 0, true)) - 1;
  }
  
  update()
  {
    const ROT_SPEED = 0.05;
    const MOVE_SPEED = 0.1;
    
    if (inputGetKey("E"))
      this.camera.rot += ROT_SPEED;
    
    if (inputGetKey("Q"))
      this.camera.rot -= ROT_SPEED;
    
    if (inputGetKey("W")) {
      this.camera.pos.x += Math.cos(this.camera.rot) * MOVE_SPEED;
      this.camera.pos.y -= Math.sin(this.camera.rot) * MOVE_SPEED;
    }
    
    if (inputGetKey("A")) {
      this.camera.pos.x += Math.sin(this.camera.rot) * MOVE_SPEED;
      this.camera.pos.y += Math.cos(this.camera.rot) * MOVE_SPEED;
    }
    
    if (inputGetKey("S")) {
      this.camera.pos.x -= Math.cos(this.camera.rot) * MOVE_SPEED;
      this.camera.pos.y += Math.sin(this.camera.rot) * MOVE_SPEED;
    }
    
    if (inputGetKey("D")) {
      this.camera.pos.x -= Math.sin(this.camera.rot) * MOVE_SPEED;
      this.camera.pos.y -= Math.cos(this.camera.rot) * MOVE_SPEED;
    }
    
    this.sprites[0].pos = this.camera.pos;
  }
}
