"use strict";

export class Tileset {
  constructor(image, tileWidth, tileHeight, tileCount, columns, tiledict)
  {
    this.image = image;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.columns = columns;
    this.tileCount = tileCount;
    this.tiledict = tiledict;
  }
}

export class Chunk {
  static WIDTH = 16;
  static HEIGHT = 16;
  
  constructor(tiles, xPos, yPos)
  {
    this.tiles = tiles;
    this.xPos = xPos;
    this.yPos = yPos;
  }
}

export class Map {
  constructor(tileset, chunks)
  {
    this.tileset = tileset;
    this.chunks = chunks;
  }
}
