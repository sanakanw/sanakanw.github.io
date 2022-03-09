"use strict";

export class face_t {
  constructor(vertices, normal)
  {
    if (vertices.length != 3)
      throw new Error("face_t::constructor(): not a triangle");
    
    this.vertices = vertices;
    this.normal = normal;
  }
}

export class brush_t {
  static BRUSH_EMPTY = 0;
  static BRUSH_SOLID = 1;
  
  constructor(faces)
  {
    this.faces = faces;
  }
}

export class map_t {
  constructor(brushes)
  {
    this.brushes = brushes;
  }
}
