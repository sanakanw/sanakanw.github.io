"use strict";

import { gl } from "./gl.js";

function compileShader(type, src)
{
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    throw "could not compile WebGL program\n\n" + info;
  }
  
  return shader;
}

export class Shader {
  constructor(srcVertexShader, srcFragmentShader)
  {
    const vertexShader = compileShader(gl.VERTEX_SHADER, srcVertexShader);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, srcFragmentShader);
    
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    
    gl.linkProgram(this.program);
    
    gl.detachShader(this.program, vertexShader);
    gl.detachShader(this.program, fragmentShader);
    
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }
  
  getUniformLocation(name)
  {
    return gl.getUniformLocation(this.program, name);
  }
  
  bind()
  {
    gl.useProgram(this.program);
  }
}
