"use strict";

import * as fs from "fs";
import * as path from "path";
import { Vector2 } from "../../src/math.js";
import { Tileset, Map, Chunk } from "../../src/map.js";

function chunkData(data, width, height)
{
  const chunksWidth = Math.floor(width / Chunk.WIDTH);
  const chunksHeight = Math.floor(height / Chunk.HEIGHT);
  
  const chunks = [];
  
  for (let yc = 0; yc < chunksHeight; yc++) {
    for (let xc = 0; xc < chunksWidth; xc++) {
      const chunkData = [];
      
      for (let yt = 0; yt < Chunk.HEIGHT; yt++) {
        for (let xt = 0; xt < Chunk.WIDTH; xt++) {
          const xp = xc * Chunk.WIDTH + xt;
          const yp = yc * Chunk.WIDTH + yt;
          
          chunkData[xt + yt * Chunk.WIDTH] = data[xp + yp * width];
        }
      }
      
      chunks.push(new Chunk(chunkData, xc, yc));
    }
  }
  
  return chunks;
}

function parseTmx(tmxPath)
{
  const tmx = JSON.parse(fs.readFileSync(tmxPath.dir + "/" + tmxPath.base));
  const tsx = path.parse(tmx.tilesets[0].source);
  
  const width = tmx.width;
  const height = tmx.height;
  
  const data = tmx.layers[0].data;
  const chunks = chunkData(data, width, height);
  
  const tileset = "assets/tilesets/" + tsx.name + ".json";
  
  return new Map(tileset, chunks);
}

function parseTsx(tsxPath)
{
  const tsx = JSON.parse(fs.readFileSync(tsxPath.dir + "/" + tsxPath.base));
  const tiledict = JSON.parse(fs.readFileSync(tsxPath.dir + "/" + tsxPath.name + ".tiledict.json"));
  
  const imagePath = path.parse(tsx.image);
  
  const image = "assets/tilesets/" + imagePath.base;
  const tileWidth = tsx.tilewidth / tsx.imagewidth;
  const tileHeight = tsx.tileheight / tsx.imageheight;
  const tileCount = tsx.tilecount;
  const columns = tsx.columns;
  
  return new Tileset(image, tileWidth, tileHeight, tileCount, columns, tiledict);
}

function main()
{
  const tmxPath = path.parse("tmx/nexus.json");
  const tsxPath = path.parse("tsx/nexus.json");
  
  const map = parseTmx(tmxPath);
  const tileset = parseTsx(tsxPath);
  
  const mapPath = "../../assets/maps/" + tmxPath.name + ".json";
  fs.writeFileSync(mapPath, JSON.stringify(map));
  
  const tilesetPath = "../../assets/tilesets/" + tsxPath.name + ".json";
  fs.writeFileSync(tilesetPath, JSON.stringify(tileset));
}

main();
