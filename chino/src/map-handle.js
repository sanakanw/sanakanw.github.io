"use strict";

import { loadJSON, loadImage } from "./asset.js";
import { Chunk } from "./map.js";

export function mapHandleLoad(path, onLoaded)
{
  loadJSON(path, (map) => {
    loadJSON(map.tileset, (tileset) => {
      loadImage(tileset.image, (image) => {
        const mapHandle = new MapHandle(tileset, image);
        
        mapHandle.newChunks(map.chunks);
        
        onLoaded(mapHandle);
      });
    });
  });
}

export class MapHandle {
  constructor(tileset, image)
  {
    this.tileset = tileset;
    this.image = image;
    this.chunkDict = {}; // use coordinates as key (TODO: change this into a quad tree or smth)
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
  
  getChunk(xPos, yPos)
  {
    return this.chunkDict[this.getChunkID(xPos, yPos)];
  }
}
