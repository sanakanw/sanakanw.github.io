import { config } from "./config.js";
import { scene_add, scene_load, scene_update } from "./common/scene.js";
import { field_scene } from "./field.js";
import { field2_scene } from "./field2.js";
import { electric_scene } from "./electric.js";
import { rope_scene } from "./rope.js";

function main()
{
  scene_add("field", field_scene);
  scene_add("field2", field2_scene);
  scene_add("rope", rope_scene);
  scene_add("electric", electric_scene);
  
  scene_load("electric");
  
  setInterval(update, config.TICKRATE);
}

function update()
{
  scene_update();
}

main();
