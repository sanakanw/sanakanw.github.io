'use strict';

import { map_t } from "./map.js";
import { client_t } from "./client.js";
import { game_t } from "./game.js";
import { display_t } from "./display.js";
import { renderer_t } from "./renderer.js";
import { screen_poll, screen_swap } from "./screen.js";
import { texture_prepare, texture_status } from "./texture.js";

function start()
{
  const client = new client_t();
  const display = new display_t(256, 144);
  const game = new game_t(client);
  const renderer = new renderer_t(game, display);
  
  const map = new map_t(64, 64);
  
  map.gen(1024, 14, 2, 2);
  
  game.new_map(map);
  renderer.new_map(map);
  
  let old_time = 0;
  
  const main_loop = function(new_time) {
    screen_poll(client);
    
    if (old_time)
      game.update(new_time - old_time);
    old_time = new_time;
    
    renderer.render();
    screen_swap(display);
    
    window.requestAnimationFrame(main_loop);
  };
  
  window.requestAnimationFrame(main_loop);
}

function main()
{
  texture_prepare("gun.png");
  texture_prepare("gun_attack.png");
  texture_prepare("moom.png");
  texture_prepare("moom_1.png");
  texture_prepare("moom_2.png");
  texture_prepare("moom_3.png");
  texture_prepare("friend.png");
  texture_prepare("wall.png");
  texture_prepare("floor.png");
  texture_prepare("ceil.png");
    
  const fn_load = setInterval(function() {
    if (texture_status()) {
      clearInterval(fn_load);
      start();
    }
  }, 10);
}

main();
