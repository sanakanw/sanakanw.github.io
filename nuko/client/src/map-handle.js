"use strict";

import { brush_t, face_t } from "./common/map.js";
import { vec3_t } from "./common/math.js";
import { asset_load_json } from "./asset.js";

export function map_load(path, on_loaded)
{
  asset_load_json(path, function(map) {
    on_loaded(new map_handle_t(map));
  });
}

export class map_handle_t {
  constructor(map)
  {
    this.brushes = [];
    
    for (const brush of map.brushes) {
      const faces = [];
      
      for (const face of brush.faces) {
        const vertices = [];
        
        const normal = new vec3_t(face.normal.x, face.normal.y, face.normal.z);
        
        for (const vertex of face.vertices)
          vertices.push(new vec3_t(vertex.x, vertex.y, vertex.z));
        
        faces.push(new face_t(vertices, normal));
      }
      
      this.brushes.push(new brush_t(faces));
    }
  }
}
