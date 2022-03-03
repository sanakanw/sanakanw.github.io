"use strict";

import { loadJSON, loadImage } from "./asset.js";
import { Chunk } from "./map.js";

export function mapHandleLoad(path, onLoaded)
{
  loadJSON(path, (map) => {
    loadJSON(map.tileset, (tileset) => {
      loadImage(tileset.image, (image) => {
        onLoaded(new MapHandle(map, tileset, image));
      });
    });
  });
}

export class MapHandle {
  constructor(map, tileset, image)
  {
    this.map = map;
    this.tileset = tileset;
    this.image = image;
    this.chunkDict = {}; // use coordinates as key (TODO: change this into a quad tree or smth)
    
    this.newChunks(map.chunks);
  }
  
  getChunkID(xPos, yPos)
  {
    // very hackish atm
    return xPos + 1024 * yPos;
  }
  
  newChunks(chunks)
  {
    for (const chunk of chunks)
      this.chunkDict[this.getChunkID(chunk.xPos, chunk.yPos)] = chunk;
  }
  
  getChunk(pos)
  {
    return this.chunkDict[this.getChunkID(pos.x, pos.y)];
  }
}
