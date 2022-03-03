"use strict";

import { gl } from "./gl.js";
import { Shader } from "./shader.js";

export class BasicShader extends Shader {
  constructor()
  {
    const srcBasicVertexShader = "" +
      "#version 300 es\n" +
      "layout(location = 0) in vec3 vPos;\n" +
      "layout(location = 1) in vec2 vTexCoord;\n" +
      "uniform mat4 uMVP;\n" +
      "out vec2 vsTexCoord;\n" +
      "void main() {\n" + 
      " vsTexCoord = vTexCoord;\n" +
      " gl_Position = uMVP * vec4(vPos, 1);\n" +
      "}\n";

    const srcBasicFragmentShader = "" +
      "#version 300 es\n" + 
      "precision mediump float;\n" +
      "out vec4 fragColor;\n" +
      "in vec2 vsTexCoord;\n" +
      "uniform sampler2D sampler;\n" +
      "void main() {\n" +
      " vec4 color = texture(sampler, vsTexCoord);\n" +
      " if (color.w == 0.0)\n" +
      "  discard;\n" +
      " fragColor = color;\n" + 
      "}";
    
    super(srcBasicVertexShader, srcBasicFragmentShader);
    
    this.ulocMVP = this.getUniformLocation("uMVP");
  }
  
  setMVP(mvp)
  {
    gl.uniformMatrix4fv(this.ulocMVP, gl.FALSE, mvp.m);
  }
}
