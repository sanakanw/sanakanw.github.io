"use strict";

import { Vertex } from "./vertex.js";
import { Vector2, Vector3 } from "./math.js";

export class SpriteMesh {
  static MAX_SPRITES = 4;
  
  constructor(meshPool, tileset, camera)
  {
    this.meshPool = meshPool;
    this.tileset = tileset;
    this.camera = camera;
    this.spriteMesh = meshPool.allocMesh(SpriteMesh.MAX_SPRITES * 6);
    this.numVertices = 0;
  }
  
  loadSprites(sprites)
  {
    const texelSize = new Vector2(this.tileset.tileWidth, this.tileset.tileHeight);
    
    const spritePos = [
      new Vector3(+0.5, +0.5, -0.5), new Vector3(+0.5, -0.5, +0.0), new Vector3(-0.5, +0.5, -1.0),
      new Vector3(-0.5, -0.5, +0.0), new Vector3(-0.5, +0.5, -1.0), new Vector3(+0.5, -0.5, +0.0)
    ];
    
    const spriteUV = [
      new Vector2(1.0, 0.0), new Vector2(1.0, 1.0), new Vector2(0.0, 0.0),
      new Vector2(0.0, 1.0), new Vector2(0.0, 0.0), new Vector2(1.0, 1.0)
    ];
    
    const vertices = [];
    
    for (const sprite of sprites) {
      let spriteOffset = new Vector3(0.0, 0.0, 0.0);
      if (sprite.stand)
        spriteOffset = new Vector3(0.0, 0.5, 0.0);
      
      for (let j = 0; j < 6; j++) {
        const spriteSizePos = spritePos[j].add(spriteOffset).mul(new Vector3(sprite.size.x, sprite.size.y, sprite.size.y));
        const spriteRotPos = spriteSizePos.zRotate(-this.camera.rot - Math.PI / 2 + sprite.rot);
        
        const spriteUVScaled = spriteUV[j].mul(sprite.size);
        const spriteUVOffset = spriteUVScaled.add(sprite.uv);
        
        const vertexPos = spriteRotPos.add(new Vector3(sprite.pos.x, sprite.pos.y, 0));
        const vertexUV = spriteUVOffset.mul(texelSize);
        
        vertices.push(new Vertex(vertexPos, vertexUV));
      }
    }
    
    this.meshPool.subMesh(this.spriteMesh, vertices);
    this.numVertices = vertices.length;
  }
  
  draw()
  {
    this.spriteMesh.subDraw(0, this.numVertices);
  }
}
