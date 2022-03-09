"use strict";

import { vec3_t } from "../common/math.js";

export class motion_t {
  constructor()
  {
    this.old_pos = new vec3_t();
    this.force = new vec3_t();
    this.inverse_mass = 1.0;
  }
  
  apply_force(force)
  {
    this.force.x += force.x * this.inverse_mass;
    this.force.y += force.y * this.inverse_mass;
    this.force.z += force.z * this.inverse_mass;
  }
  
  apply_impulse(impulse)
  {
    this.old_pos.x -= impulse.x * this.inverse_mass;
    this.old_pos.y -= impulse.y * this.inverse_mass;
    this.old_pos.z -= impulse.z * this.inverse_mass;
  }
};
