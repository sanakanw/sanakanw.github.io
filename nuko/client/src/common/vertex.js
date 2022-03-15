"use strict";

import { vec3_t, sum_of_array } from "./math.js";

export class vertex_t {
  static VERTEX_ATTRIB  = [ 3, 2 ];
  static ATTRIB_SIZE    = sum_of_array(this.VERTEX_ATTRIB);
  static BYTE_SIZE      = this.ATTRIB_SIZE * 4;
  
  constructor(pos, uv)
  {
    this.pos = pos;
    this.uv = uv;
  }
}
