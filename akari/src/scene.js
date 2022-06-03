"use strict";

let scene_now = null;

export function scene_load(scene)
{
  scene_now = scene;
  scene_now.load();
}

export function scene_frame()
{
  if (scene_now)
    scene_now.frame();
}
