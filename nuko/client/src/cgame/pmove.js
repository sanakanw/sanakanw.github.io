"use strict";

import { quat_t } from "../common/math.js";

export class pmove_t {
  constructor()
  {
    this.grounded = false;
    this.move_rot = new quat_t();
  }
}
