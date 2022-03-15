"use strict";

import { gl } from "./gl.js";
import { mesh_pool_t } from "./mesh-pool.js";
import { basic_shader_t } from "./basic-shader.js";
import { texture_t } from "./texture.js";

import { screen } from "../screen.js";
import { asset_load_json, asset_load_image } from "../asset.js";

import { vertex_t } from "../common/vertex.js";
import { vec3_t, mat4_t, quat_t } from "../common/math.js";

export class renderer_t {
  constructor(cgame)
  {
    gl.clearColor(0.2, 0.7, 1.0, 1.0);
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
  
    gl.cullFace(gl.FRONT);
    gl.depthFunc(gl.LESS);
    
    this.cgame = cgame;
    this.mesh_pool = new mesh_pool_t(16 * 1024);
    this.basic_shader = new basic_shader_t();
    this.map_meshes = [];
    
    const FOV = 90 * Math.PI / 180.0;
    const aspect_ratio = screen.height / screen.width;
    
    this.view_matrix = mat4_t.init_identity();
    this.projection_matrix = mat4_t.init_perspective(aspect_ratio, FOV, 0.1, 100);
    
    this.basic_shader.bind();
    
    asset_load_image("asset/mtl/brick.png", (image) => {
      this.texture = new texture_t(image);
      this.texture.bind();
    });
  }
  
  new_map(map_handle)
  {
    this.mesh_pool.reset(0);
    this.textures = [];
    this.map_meshes = [];
    this.map_handle = map_handle;
    
    for (const brushgroup of map_handle.brushgroups) {
      const vertices = [];
      
      for (let i = brushgroup.brushofs; i < brushgroup.brushend; i++) {
        const brush = map_handle.brushes[i];
        
        for (const face of brush.faces) {
          for (const vertex of face.vertices) {
            vertices.push(vertex);
          }
        }
      }
      
      this.map_meshes.push(this.mesh_pool.new_mesh(vertices));
    }
    
    for (let i = 0; i < map_handle.materials.length; i++) {
      asset_load_image(map_handle.materials[i].texture, (image) => {
        this.textures[i] = new texture_t(image);
      });
    }
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
    
    if (this.map_meshes.length > 0) {
      for (let i = 0; i < this.map_handle.brushgroups.length; i++) {
        const id_material = this.map_handle.brushgroups[i].id_material;
        if (this.textures[id_material]) {
          this.textures[id_material].bind();
          this.map_meshes[i].draw();
        }
      }
    }
  } 
};
