"use strict";

import { input_t } from "./input.js";
import { cgame_t } from "./cgame/cgame.js";
import { renderer_t } from "./renderer/renderer.js";
import { map_load } from "./map-handle.js";

export class client_t {
  constructor()
  {
    this.input = new input_t();
    this.cgame = new cgame_t();
    this.renderer = new renderer_t(this.cgame);
    
    map_load("./asset/map/nk_flatgrass.json", (map_handle) => {
      this.cgame.new_map(map_handle);
      this.renderer.new_map(map_handle);
    });
  }
  
  update()
  {
    const usercmd = this.input.base_move();
    
    this.cgame.recv_cmd(usercmd);
    this.cgame.update();
    this.renderer.render();
  }
};
