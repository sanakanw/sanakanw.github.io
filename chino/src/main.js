"use strict";

import { Server } from "./server.js";
import { Client } from "./client.js";
import { mapHandleLoad } from "./map-handle.js";

function main()
{
  const server = new Server();
  const client = new Client(server);
  
  mapHandleLoad("/assets/maps/nexus.json", (mapHandle) => {
    server.newMap(mapHandle);
    
    setInterval(() => {
      client.update();
      server.update();
    }, 15);
  });
}

main();
