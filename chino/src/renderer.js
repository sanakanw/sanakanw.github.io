"use strict";

import { Sprite } from "./sprite.js";
import { loadImage, loadJSON } from "./asset.js";
import { gl } from "./gl.js";
import { Vertex } from "./vertex.js";
import { MeshPool } from "./mesh-pool.js";
import { Vector2, Vector3, Matrix4 } from "./math.js";
import { BasicShader } from "./basic-shader.js";
import { Chunk } from "./map.js";
import { MapMesh } from "./map-mesh.js";
import { SpriteMesh } from "./sprite-mesh.js";
import { Texture } from "./texture.js";

export class Renderer {
  constructor(game)
  {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    
    gl.clearColor(0.0, 0.5, 1.0, 1);
    
    this.game = game;
    this.basicShader = new BasicShader();
    this.meshPool = new MeshPool(8 * 1024);
    this.mapMesh = null;
    this.spriteMesh = null;
    
    this.basicShader.bind();
    
    const fov = 12.0;
    
    this.mapProjectionMatrix = Matrix4.initOrthogonalPerspective(
      -fov,
      +fov,
      +fov,
      -fov,
      +fov,
      -fov);
    
    this.spriteProjectionMatrix = Matrix4.initOrthogonal(
      -fov,
      +fov,
      +fov,
      -fov,
      +fov,
      -fov);
  }
  
  newMap(mapHandle)
  {
    this.mapTexture = new Texture(mapHandle.image);
    this.mapTexture.bind();
    
    this.meshPool.reset();
    
    this.mapMesh = new MapMesh(this.meshPool, mapHandle);
    this.spriteMesh = new SpriteMesh(this.meshPool, mapHandle.tileset, this.game.camera);
  }
  
  setupViewMatrix()
  {
    const viewPos = this.game.camera.pos.mulf(-1);
    const viewRot = -this.game.camera.rot;
    
    const translationMatrix = Matrix4.initTranslation(viewPos);
    const rotationMatrix = Matrix4.initRotation(viewRot);
    
    this.viewMatrix = translationMatrix.mul(rotationMatrix);
  }
  
  renderView()
  {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    this.setupViewMatrix();
    
    this.renderMap();
    this.renderSprite();
  }
  
  renderSprite()
  {
    const viewProjectionMatrix = this.viewMatrix.mul(this.spriteProjectionMatrix);
    this.basicShader.setMVP(viewProjectionMatrix);
    
    this.spriteMesh.loadSprites(this.game.sprites);
    this.spriteMesh.draw();
  }
  
  renderMap()
  {
    const viewProjectionMatrix = this.viewMatrix.mul(this.mapProjectionMatrix);
    this.basicShader.setMVP(viewProjectionMatrix);
    
    const xPos = this.game.camera.pos.x;
    const yPos = this.game.camera.pos.y;
    
    for (let yc = -1; yc <= 1; yc++) {
      for (let xc = -1; xc <= 1; xc++) {
        const chunkPos = new Vector2(xPos + xc * Chunk.WIDTH, yPos + yc * Chunk.HEIGHT);
        const chunkMesh = this.mapMesh.getChunkMesh(chunkPos);
        
        if (chunkMesh)
          chunkMesh.draw();
      }
    }
  }
}
