"use strict";

import { Renderer } from "./renderer.js";

export class Client {
  constructor(server)
  {
    this.server = server;
    this.id = server.newClient(this);
    this.renderer = new Renderer(server.game);
  }
  
  newMap(mapHandle)
  {
    this.mapHandle = mapHandle;
    this.renderer.newMap(mapHandle);
  }
  
  newChunks(chunks)
  {
    this.mapHandle.newChunks(chunks);
  }
  
  update()
  {
    this.renderer.renderView();
  }
}
