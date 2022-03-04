"use strict";

import { Vector2 } from "./math.js";
import { Game } from "./game.js";
import { MapHandle } from "./map-handle.js";
import { Chunk } from "./map.js";

export class Server {
  constructor()
  {
    this.game = new Game();
    this.clients = [];
  }
  
  newClient(client)
  {
    this.clients.push(client);
    return this.game.newPlayer();
  }
  
  newMap(mapHandle)
  {
    this.mapHandle = mapHandle;
    
    for (const client of this.clients)
      client.newMap(new MapHandle(mapHandle.tileset, mapHandle.image));
  }
  
  update()
  {
    this.game.update();
    
    for (const client of this.clients) {
      const chunks = [];
      for (let yc = -1; yc <= 1; yc++) {
        for (let xc = -1; xc <= 1; xc++) {
          const pos = this.game.sprites[client.id].pos;
          
          const xPos = Math.floor(pos.x / Chunk.WIDTH) + xc;
          const yPos = Math.floor(pos.y / Chunk.WIDTH) + yc;
          
          const chunk = this.mapHandle.getChunk(xPos, yPos);
          
          if (chunk)
            chunks.push(chunk);
        }
      }
      
      client.newChunks(chunks);
    }
  }
}
