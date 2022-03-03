"use strict";

import { Chunk } from "./map.js";
import { Vertex } from "./vertex.js";
import { Vector2, Vector3 } from "./math.js";

export class MapMesh {
  constructor(meshPool, mapHandle)
  {
    this.meshPool = meshPool;
    this.mapHandle = mapHandle;
    
    this.chunkMesh = {};
  }
  
  getChunkMesh(pos)
  {
    const xPos = Math.floor(pos.x / Chunk.WIDTH);
    const yPos = Math.floor(pos.y / Chunk.WIDTH);
    
    const chunkID = this.mapHandle.getChunkID(xPos, yPos);
    
    if (chunkID in this.mapHandle.chunkDict) {
      if (!(chunkID in this.chunkMesh))
        this.chunkMesh[chunkID] = this.genChunkMesh(this.mapHandle.chunkDict[chunkID]);
      
      return this.chunkMesh[chunkID];
    } else {
      return null;
    }
  }
  
  genChunkMesh(chunk)
  {
    const vertices = [];
    
    for (let yt = 0; yt < Chunk.HEIGHT; yt++) {
      for (let xt = 0; xt < Chunk.WIDTH; xt++) {
        const chunkPos = new Vector3(chunk.xPos * Chunk.WIDTH, chunk.yPos * Chunk.HEIGHT, 0);
        const tilePos = chunkPos.add(new Vector3(xt, yt, 0));
        
        const tile = chunk.tiles[xt + yt * Chunk.WIDTH];
        
        if (tile in this.mapHandle.tileset.tiledict) {
          const tileData = this.mapHandle.tileset.tiledict[tile];
          
          const omittedSides = this.chunkTestAdjacent(chunk, xt, yt);
          
          let yHeight = 0;
          for (const block of tileData.blocks) {
            this.genBlock(vertices, this.tileToTexCoord(block), tilePos.add(new Vector3(0, 0, yHeight)), omittedSides);
            yHeight--;
          }
          
          this.genTile(vertices, this.tileToTexCoord(tile), tilePos.add(new Vector3(0, 0, yHeight)));
        } else {
          this.genTile(vertices, this.tileToTexCoord(tile), tilePos);
        }
      }
    }
    
    return this.meshPool.newMesh(vertices);
  }
  
  genTile(vertices, texOffset, posOffset)
  {
    const tangent = new Vector3(1, 0, 0);
    const bitangent = new Vector3(0, 1, 0);
    
    this.genSquare(vertices, texOffset, posOffset, tangent, bitangent);
  }
  
  genBlock(vertices, texOffset, posOffset, omittedSides)
  {
    const offsetTangentBitangent = [
      [ new Vector3( 1.0, +1.0,  0.0), new Vector3(-1.0,  0.0,  0.0), new Vector3( 0.0,  0.0, -1.0) ], // front ( 0,  0, +1)
      [ new Vector3( 0.0, +1.0,  0.0), new Vector3( 0.0, -1.0,  0.0), new Vector3( 0.0,  0.0, -1.0) ], // left  (-1,  0,  0)
      [ new Vector3( 0.0,  0.0,  0.0), new Vector3(+1.0,  0.0,  0.0), new Vector3( 0.0,  0.0, -1.0) ], // back  ( 0,  0, -1)
      [ new Vector3(+1.0,  0.0,  0.0), new Vector3( 0.0,  1.0,  0.0), new Vector3( 0.0,  0.0, -1.0) ]  // right (+1,  0,  0)
    ];
        
    for (let i = 0; i < offsetTangentBitangent.length; i++) {
      if (!omittedSides[i]) {
        const offset = offsetTangentBitangent[i][0];
        const tangent = offsetTangentBitangent[i][1];
        const bitangent = offsetTangentBitangent[i][2];
        
        const squarePos = posOffset.add(offset);
        
        this.genSquare(vertices, texOffset, squarePos, tangent, bitangent);
      }
    }
  }

  genSquare(vertices, texOffset, posOffset, tangent, bitangent)
  {
    const texelSize = new Vector2(this.mapHandle.tileset.tileWidth, this.mapHandle.tileset.tileHeight);
    
    const squareTemplate = [
      new Vector2(0, 0),
      new Vector2(0, 1),
      new Vector2(1, 0),
      
      new Vector2(1, 1),
      new Vector2(1, 0),
      new Vector2(0, 1)
    ];
    
    for (let i = 0; i < squareTemplate.length; i++) {
      const squarePos = squareTemplate[i];
      
      const vertexTexCoord = texOffset.add(squarePos).mul(texelSize);
      const vertexPos = posOffset.add(tangent.mulf(squarePos.x)).add(bitangent.mulf(squarePos.y));
      
      const vertex = new Vertex(vertexPos, vertexTexCoord);
      
      vertices.push(vertex);
    }
  }
  
  chunkTestAdjacent(chunk, xTile, yTile)
  {
    const check = [
      [  0, +1 ],
      [ -1,  0 ],
      [  0, -1 ],
      [ +1,  0 ]
    ];
    
    let adjacent = [];
    
    for (let i = 0; i < check.length; i++) {
      const xCheck = xTile + check[i][0];
      const yCheck = yTile + check[i][1];
      
      const tile = chunk.tiles[xCheck + yCheck * Chunk.WIDTH];
      
      if (xCheck < 0 || yCheck < 0 || xCheck >= Chunk.WIDTH || yCheck >= Chunk.HEIGHT) {
        adjacent.push(false);
      } else {
        if (tile) {
          if (tile in this.mapHandle.tileset.tiledict)
            adjacent.push(true);
          else
            adjacent.push(false);
        }
      }
    }
    
    return adjacent;
  }

  tileToTexCoord(tile)
  {
    const xTex = Math.floor((tile - 1) % this.mapHandle.tileset.columns);
    const yTex = Math.floor((tile - 1) / this.mapHandle.tileset.columns);
    
    return new Vector2(xTex, yTex);
  }
}

