"use strict";

import { config } from "./config.js";
import { scene_phys_t } from "./scene_phys.js";
import { scene_wave_t } from "./scene_wave.js";
import { scene_load, scene_frame } from "./scene.js";

function main()
{
  const scene_phys = new scene_phys_t();
  const scene_wave = new scene_wave_t();
  
  document.getElementById("box").onclick = () => scene_load(scene_phys);
  document.getElementById("wave").onclick = () => scene_load(scene_wave);
  
  scene_load(scene_phys);
  
  setInterval(function() {
    scene_frame();
  }, config.TICKRATE);
}

main();
