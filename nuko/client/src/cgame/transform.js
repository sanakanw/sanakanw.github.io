"use strict";

import { vec3_t, quat_t } from "../common/math.js";

export class transform_t {
  constructor()
  {
    this.pos = new vec3_t();
    this.rot = new quat_t();
  }
}
