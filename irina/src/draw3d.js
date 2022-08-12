"use strict";

import { vec2_t } from "./math.js";

export class draw3d_t {
  draw;
  camera;
  
  constructor(draw, camera)
  {
    this.draw = draw;
    this.camera = camera;
  }
  
  project_3d(y_dist)
  {
    return 1 / y_dist * this.camera.tan_half_fov;
  }
  
  screen_space(pos)
  {
    const y_project = this.project_3d(pos.y);
    
    return new vec2_t(
      pos.x * y_project,
      -this.camera.z_height * y_project
    );
  }
  
  circle(pos, radius)
  {
    const cam_pos = this.camera.camera_space(pos);
    const screen_pos = this.screen_space(cam_pos);
    
    this.draw.circle(
      screen_pos,
      radius * this.project_3d(cam_pos.y));
  }
  
  line(a, b)
  {
    const cam_a = this.camera.camera_space(a);
    const cam_b = this.camera.camera_space(b);
    
    if (cam_a.y < 0 && cam_b.y < 0) {
      return;
    } else if (cam_a.y < 0.1) {
      const m = (cam_b.x - cam_a.x) / (cam_b.y - cam_a.y);
      cam_a.x = cam_a.x + m * (0.1 - cam_a.y);
      cam_a.y = 0.1;
    } else if (cam_b.y < 0.1) {
      const m = (cam_a.x - cam_b.x) / (cam_a.y - cam_b.y);
      cam_b.x = cam_b.x + m * (0.1 - cam_b.y);
      cam_b.y = 0.1;
    }
    
    const screen_a = this.screen_space(cam_a);
    const screen_b = this.screen_space(cam_b);
    
    this.draw.line(screen_a, screen_b);
  }
};
