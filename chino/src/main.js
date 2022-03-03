"use strict";

import { Game } from "./game.js";
import { Renderer } from "./renderer.js";
import { mapHandleLoad } from "./map-handle.js";

function main()
{
  const game = new Game();
  const renderer = new Renderer(game);
  
  mapHandleLoad("/assets/maps/nexus.json", (mapHandle) => {
    renderer.newMap(mapHandle);
  
    setInterval(() => {
      game.update();
      renderer.renderView();
    }, 15);
  });
}

main();
