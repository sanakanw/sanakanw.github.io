'use strict';

import { map_t } from "./map.js";
import { client_t } from "./client.js";
import { game_t } from "./game.js";
import { display_t } from "./display.js";
import { renderer_t } from "./renderer.js";
import { screen_poll, screen_swap } from "./screen.js";
import { texture_status } from "./texture.js";

function main()
{
  const client = new client_t();
  const display = new display_t(256, 144);
  const game = new game_t(client);
  const renderer = new renderer_t(game, display);
  
  const map = new map_t(64, 64);
  
  map.gen(128, 8, 2, 2);
  
  game.new_map(map);
  renderer.new_map(map);
  
  let t0 = null;
  
  const main_loop = function(t1) {
    screen_poll(client);
    
    if (t0)
      game.update(t1 - t0);
    
    t0 = t1;
    
    renderer.render();
    screen_swap(display);
    
    window.requestAnimationFrame(main_loop);
  };
  
  window.requestAnimationFrame(main_loop);
}

const assets_ready = setInterval(function() {
  if (texture_status()) {
    clearInterval(assets_ready);
    main();
  }
}, 10);
