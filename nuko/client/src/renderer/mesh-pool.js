"use strict";

import { gl } from "./gl.js";
import { vertex_t } from "./vertex.js";

function vertex_to_array_buffer(vertices)
{
  const array_size = vertices.length * vertex_t.ATTRIB_SIZE;
  const float_array = new Float32Array(array_size);
  
  for (let i = 0; i < vertices.length; i++) {
    float_array[i * vertex_t.ATTRIB_SIZE + 0] = vertices[i].pos.x;
    float_array[i * vertex_t.ATTRIB_SIZE + 1] = vertices[i].pos.y;
    float_array[i * vertex_t.ATTRIB_SIZE + 2] = vertices[i].pos.z;
  }
  
  return float_array;
}

class mesh_t {
  constructor(vertex_offset, num_vertices)
  {
    this.vertex_offset = vertex_offset;
    this.num_vertices = num_vertices;
  }
  
  draw()
  {
    gl.drawArrays(
      gl.TRIANGLES,
      this.vertex_offset,
      this.num_vertices);
  }
}

export class mesh_pool_t {
  constructor(max_vertices)
  {
    this.max_vertices = max_vertices;
    this.vertex_pointer = 0;
    
    this.vertex_array_object = gl.createVertexArray();
    gl.bindVertexArray(this.vertex_array_object);
    
    const vertex_buffer_object = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer_object);
    gl.bufferData(gl.ARRAY_BUFFER, max_vertices * vertex_t.BYTE_SIZE, gl.STATIC_DRAW);
    
    let offset = 0;
    
    for (let i = 0; i < vertex_t.VERTEX_ATTRIB.length; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, vertex_t.VERTEX_ATTRIB[i], gl.FLOAT, false, vertex_t.BYTE_SIZE, offset);
      offset += vertex_t.VERTEX_ATTRIB[i] * 4;
    }
  }
  
  reset(offset)
  {
    this.vertex_pointer = offset;
  }
  
  new_mesh(vertices)
  {
    const mesh = this.allocate_mesh(vertices.length);
    this.sub_mesh(mesh, vertices);
    return mesh;
  }
  
  allocate_mesh(num_vertices)
  {
    const vertex_offset = this.vertex_pointer;
    
    if (this.vertex_pointer + num_vertices >= this.max_vertices)
      throw "mesh_pool_t::allocate_mesh(): ran out of memory";
    
    this.vertex_pointer += num_vertices;
    
    return new mesh_t(vertex_offset, num_vertices);
  }
  
  sub_mesh(mesh, vertices)
  {
    if (mesh.vertex_offset + vertices.length > this.max_vertices)
      throw "MeshPool::subMesh(): too many vertices";
    
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      mesh.vertex_offset * vertex_t.BYTE_SIZE,
      vertex_to_array_buffer(vertices));
  }
}
