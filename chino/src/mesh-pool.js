"use strict";

import { gl } from "./gl.js";
import { Vertex } from "./vertex.js";

function verticesToArrayBuffer(vertices)
{
  const arraySize = vertices.length * Vertex.ATTRIB_SIZE;
  const floatArray = new Float32Array(arraySize);
  
  for (let i = 0; i < vertices.length; i++) {
    floatArray[i * Vertex.ATTRIB_SIZE + 0] = vertices[i].pos.x;
    floatArray[i * Vertex.ATTRIB_SIZE + 1] = vertices[i].pos.y;
    floatArray[i * Vertex.ATTRIB_SIZE + 2] = vertices[i].pos.z;
    
    floatArray[i * Vertex.ATTRIB_SIZE + 3] = vertices[i].texCoord.x;
    floatArray[i * Vertex.ATTRIB_SIZE + 4] = vertices[i].texCoord.y;
  }
  
  return floatArray;
}

class Mesh {
  constructor(vertexOffset, numVertices)
  {
    this.vertexOffset = vertexOffset;
    this.numVertices = numVertices;
  }
  
  draw()
  {
    gl.drawArrays(
      gl.TRIANGLES,
      this.vertexOffset,
      this.numVertices);
  }
  
  subDraw(offset, size)
  {
    gl.drawArrays(
      gl.TRIANGLES,
      this.vertexOffset + offset,
      size);
  }
}

export class MeshPool {
  constructor(maxVertices)
  {
    this.maxVertices = maxVertices;
    this.vertexPointer = 0;
    
    this.vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(this.vertexArrayObject);
    
    const vertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, maxVertices * Vertex.BYTE_SIZE, gl.STATIC_DRAW);
    
    let offset = 0;
    
    for (let i = 0; i < Vertex.VERTEX_ATTRIB.length; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, Vertex.VERTEX_ATTRIB[i], gl.FLOAT, false, Vertex.BYTE_SIZE, offset);
      offset += Vertex.VERTEX_ATTRIB[i] * 4;
    }
  }
  
  reset(offset)
  {
    this.vertexPointer = offset;
  }
  
  newMesh(vertices)
  {
    const mesh = this.allocMesh(vertices.length);
    this.subMesh(mesh, vertices);
    return mesh;
  }
  
  allocMesh(numVertices)
  {
    const vertexOffset = this.vertexPointer;
    
    if (this.vertexPointer + numVertices >= this.maxVertices)
      throw "MeshPool::allocateMesh(): ran out of memory";
    
    this.vertexPointer += numVertices;
    
    return new Mesh(vertexOffset, numVertices);
  }
  
  subMesh(mesh, vertices)
  {
    if (mesh.vertexOffset + vertices.length > this.maxVertices)
      throw "MeshPool::subMesh(): too many vertices";
    
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      mesh.vertexOffset * Vertex.BYTE_SIZE,
      verticesToArrayBuffer(vertices));
  }
}
