const scene_dict = {};

let scene_now;

export class scene_t {
  constructor(f_init, f_update)
  {
    this.f_init = f_init;
    this.f_update = f_update;
  }
};

export function scene_add(name, scene)
{
  scene_dict[name] = scene;
}

export function scene_load(name)
{
  scene_now = scene_dict[name];
  
  if (scene_now)
    scene_now.f_init();
}

export function scene_update()
{
  if (scene_now)
    scene_now.f_update();
}
