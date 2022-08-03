"use strict";

import { input } from "../lib/input.js";
import { config } from "../lib/config.js";
import { vec2_t } from "../lib/math.js";
import { draw } from "../lib/draw.js";

class body_t {
  constructor(pos, vel)
  {
    this.pos = pos;
    this.vel = new vec2_t();
  }
};

function main()
{
  setInterval(function() {
  }, config.TIMESTEP);
}

main();
