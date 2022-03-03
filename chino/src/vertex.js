"use strict";

import { Vector3, sumOfArray } from "./math.js";

export class Vertex {
  static VERTEX_ATTRIB = [ 3, 2 ];
  static ATTRIB_SIZE = sumOfArray(this.VERTEX_ATTRIB);
  static BYTE_SIZE = this.ATTRIB_SIZE * 4;
  
  constructor(pos, texCoord)
  {
    this.pos = pos;
    this.texCoord = texCoord;
  }
}
