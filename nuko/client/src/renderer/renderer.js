"use strict";

import { gl } from "./gl.js";
import { vertex_t } from "./vertex.js";
import { mesh_pool_t } from "./mesh-pool.js";
import { basic_shader_t } from "./basic-shader.js";

import { screen } from "../screen.js";
import { asset_load_json } from "../asset.js";

import { vec3_t, mat4_t, quat_t } from "../common/math.js";

export class renderer_t {
  constructor(cgame)
  {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
  
    gl.cullFace(gl.FRONT);
    gl.depthFunc(gl.LESS);
    
    this.cgame = cgame;
    this.mesh_pool = new mesh_pool_t(16 * 1024);
    this.basic_shader = new basic_shader_t();
    
    const FOV = 90 * Math.PI / 180.0;
    const aspect_ratio = screen.height / screen.width;
    
    this.view_matrix = mat4_t.init_identity();
    this.projection_matrix = mat4_t.init_perspective(aspect_ratio, FOV, 0.1, 100);
    
    this.basic_shader.bind();
  }
  
  new_map(map_handle)
  {
    this.mesh_pool.reset(0);
    
    const vertices = [];
    
    for (const brush of map_handle.brushes) {
      for (const face of brush.faces) {
        for (const vertex of face.vertices) {
          vertices.push(new vertex_t(vertex));
        }
      }
    }
    
    this.mesh = this.mesh_pool.new_mesh(vertices);
  }
  
  setup_view_matrix()
  {
    const view_origin = this.cgame.c_transform[this.cgame.player].pos;
    const view_angle = this.cgame.c_transform[this.cgame.player].rot;
    
    const inverted_origin = view_origin.mulf(-1);
    const inverted_angle = view_angle.conjugate();
    
    const translation_matrix = mat4_t.init_translation(inverted_origin);
    const rotation_matrix = mat4_t.init_rotation(inverted_angle);
    
    this.view_matrix = translation_matrix.mul(rotation_matrix);
  }
  
  render()
  {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    this.setup_view_matrix();
    
    const theta = performance.now() * 0.001;
    
    const transform = mat4_t.init_identity();// mat4_t.init_rotation(quat_t.init_rotation(new vec3_t(0, 0, 1), theta));
    const mvp = transform.mul(this.view_matrix).mul(this.projection_matrix);
    
    this.basic_shader.set_mvp(mvp);
    
    if (this.mesh)
      this.mesh.draw();
  } 
};
