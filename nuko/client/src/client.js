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
    
    map_load("./assets/nk_test1.json", (map_handle) => {
      this.cgame.new_map(map_handle);
      this.renderer.new_map(map_handle);
    });
    
    document.getElementById("load_nk_test1").addEventListener("click", () => {
      map_load("./assets/nk_test1.json", (map_handle) => {
        this.cgame.new_map(map_handle);
        this.renderer.new_map(map_handle);
      });
    });
    
    document.getElementById("load_nk_test2").addEventListener("click", () => {
      map_load("./assets/nk_test2.json", (map_handle) => {
        this.cgame.new_map(map_handle);
        this.renderer.new_map(map_handle);
      });
    });
    
    document.getElementById("load_nk_test2").addEventListener("click", () => {
      map_load("./assets/nk_test2.json", (map_handle) => {
        this.cgame.new_map(map_handle);
        this.renderer.new_map(map_handle);
      });
    });
    
    document.getElementById("load_nk_test3").addEventListener("click", () => {
      map_load("./assets/nk_test3.json", (map_handle) => {
        this.cgame.new_map(map_handle);
        this.renderer.new_map(map_handle);
      });
    });
    
    document.getElementById("load_nk_test4").addEventListener("click", () => {
      map_load("./assets/nk_test4.json", (map_handle) => {
        this.cgame.new_map(map_handle);
        this.renderer.new_map(map_handle);
      });
    });
    
    document.getElementById("load_nk_test5").addEventListener("click", () => {
      map_load("./assets/nk_test5.json", (map_handle) => {
        this.cgame.new_map(map_handle);
        this.renderer.new_map(map_handle);
      });
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
