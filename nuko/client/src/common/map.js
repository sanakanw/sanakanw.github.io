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

export class material_t {
  constructor(texture)
  {
    this.texture = texture;
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

export class brushgroup_t {
  constructor(id_material, brushofs, brushend)
  {
    this.id_material = id_material;
    this.brushofs = brushofs;
    this.brushend = brushend;
  }
}

export class map_t {
  constructor(brushes, brushgroups, materials)
  {
    this.brushes = brushes;
    this.brushgroups = brushgroups;
    this.materials = materials;
  }
}
