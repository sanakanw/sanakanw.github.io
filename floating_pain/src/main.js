import { rand, vec2_t } from "./math.js";
import { pen_t } from "./pen.js";
import { cam_t } from "./cam.js";
import { key_t, input_t } from "./input.js";

const kills = document.getElementById("kills");

// it's fucking 6:29am
// im sorry the code is bad

// how to handle collision without class fuckery in ooo
// im too dumb and lazY(cope) to figure it out
export class clip_t {
  constructor(normal, depth)
  {
    this.normal = normal;
    this.depth = depth;
  }
};

const map_range = 20;

function check_circle(p1, r1, p2, r2)
{
  const delta_pos = p1.sub(p2);
  const delta_dist = delta_pos.length();
  
  const radius = r1 + r2;
  
  const depth = radius - delta_dist;
  
  return new clip_t(delta_pos.normalize(), depth);
}

export class hook_t {
  constructor()
  {
    this.pos = new vec2_t();
    this.vel = new vec2_t();
    this.length = 0.0;
    this.active = false;
    this.anchor = false;
  }
  
  shoot(origin, dir)
  {
    this.pos = origin;
    this.vel = dir;
    this.active = true;
    this.anchor = false;
  }
  
  update(trees, titans)
  {
    if (!this.active)
      return;
    
    if (!this.anchor) {
      this.pos = this.pos.add(this.vel.mulf(TIMESTEP));
      this.collide(trees, titans);
      
      this.length += this.vel.length() * TIMESTEP;
      if (this.length > 15.0)
        this.release();
    }
  }
  
  release()
  {
    if (this.anchor || this.length > 15) {
      this.active = false;
      this.anchor = false;
      this.length = 0;
    }
  }
  
  collide(trees, titans)
  {
    if (this.pos.x < -map_range || this.pos.x > map_range || this.pos.y < -map_range || this.pos.y > map_range) {
      this.anchor = true;
      this.vel = new vec2_t();
    }
    
    for (const tree of trees) {
      const hit = check_circle(this.pos, 0.2, tree.pos, tree.radius);
      
      if (hit.depth > 0) {
        this.anchor = true;
        this.pos = this.pos.add(hit.normal.mulf(hit.depth));
        this.vel = new vec2_t();
      }
    }
    
    for (const titan of titans) {
      if (!titan.alive)
        continue;
      
      const hit = check_circle(this.pos, 0.2, titan.pos, titan.radius);
      
      if (hit.depth > 0) {
        this.anchor = true;
        this.pos = this.pos.add(hit.normal.mulf(hit.depth));
        this.vel = new vec2_t();
      }
    }
  }
};

export class pain_t {
  constructor()
  {
    this.pos = new vec2_t();
    this.vel = new vec2_t();
    this.hook = new hook_t();
    this.hook_b = new hook_t();
    this.is_gas = false;
    this.is_reel_out = false;
  }
  
  update(trees, titans)
  {
    if (this.is_gas)
      this.apply_gas();
    
    this.constrain();
    
    this.collide(trees, titans);
    this.integrate();
    
    this.hook.update(trees, titans);
    this.hook_b.update(trees, titans);
    
    this.is_gas = false;
    this.is_reel_out = false;
    
    if (this.pos.x < -map_range) {
      this.pos.x = -map_range + 0.1;
      this.vel.x = 0;
    }
    if (this.pos.x > +map_range) {
      this.pos.x = +map_range - 0.1;
      this.vel.x = 0;
    }
    if (this.pos.y < -map_range) {
      this.pos.y = -map_range + 0.1;
      this.vel.y = 0;
    }
    if (this.pos.y > +map_range) {
      this.pos.y = +map_range - 0.1;
      this.vel.y = 0;
    }
  }
  
  apply_gas()
  {
    this.vel = this.vel.add(this.vel.normalize().mulf(1.0 * TIMESTEP));
  }
  
  integrate()
  {
    this.pos = this.pos.add(this.vel.mulf(TIMESTEP));
  }
  
  reel_in()
  {
    if (this.is_perp(this.hook)) {
      const hook_dir = this.pos.sub(this.hook.pos).normalize();
      const lambda = -60 * Math.PI / 180.0 * this.vel.length();
      
      const a = this.vel.mulf(-0.6);
      const b = hook_dir.mulf(lambda);
      const c = a.add(b);
      this.vel = this.vel.add(c);
    }
    
    if (this.is_perp(this.hook_b)) {
      const hook_dir = this.pos.sub(this.hook_b.pos).normalize();
      const lambda = -60 * Math.PI / 180.0 * this.vel.length();
      
      const a = this.vel.mulf(-0.6);
      const b = hook_dir.mulf(lambda);
      const c = a.add(b);
      this.vel = this.vel.add(c);
    }
  }
  
  constrain()
  {
    let f_hook = new vec2_t();
    let f_pull = new vec2_t();
    if (this.hook.anchor) {
      const hook_dir = this.pos.sub(this.hook.pos);
      
      if (this.is_perp(this.hook)) {
        if (this.is_gas && !this.is_reel_out) {
          const theta = this.vel.length() * TIMESTEP / hook_dir.length();
          const perp_dir = hook_dir.cross_up();
          const rot_dir = perp_dir.dot(this.vel) > 0 ? 1 : -1;
          f_hook =  perp_dir.normalize().rotate(-0.0 * rot_dir).mulf(rot_dir);
        } else if (!this.is_gas) {
          this.vel = this.vel.mulf(0.97);
        }
      }
      
      if (!this.is_reel_out)
        f_pull = hook_dir.mulf(-0.7 * TIMESTEP);
    }
    
    let f_hook_b = new vec2_t();
    let f_pull_b = new vec2_t();
    
    if (this.hook_b.anchor) {
      const hook_dir_b = this.pos.sub(this.hook_b.pos);
      
      if (this.is_perp(this.hook_b)) {
        if (this.is_gas && !this.is_reel_out) {
          const theta = this.vel.length() * TIMESTEP / hook_dir_b.length();
          const perp_dir = hook_dir_b.cross_up();
          const rot_dir = perp_dir.dot(this.vel) > 0 ? 1 : -1;
          f_hook_b =  perp_dir.normalize().rotate(-0.0 * rot_dir).mulf(rot_dir);
        } else if (!this.is_gas) {
          this.vel = this.vel.mulf(0.97);
        }
      }
      
      if (!this.is_reel_out)
        f_pull_b = hook_dir_b.mulf(-0.7 * TIMESTEP);
    }
    
    if (f_hook.length() > 0 || f_hook_b.length() > 0) {
      const f_net_hook = f_hook.add(f_hook_b).normalize().mulf(this.vel.length()).sub(this.vel);
      this.vel = this.vel.add(f_net_hook);
    }
    
    const f_net_pull = f_pull.add(f_pull_b);
    
    this.vel = this.vel.add(f_net_pull);
  }
  
  collide(trees, titans)
  {
    for (const tree of trees) {
      const hit = check_circle(this.pos, 0.1, tree.pos, tree.radius);
      
      if (hit.depth > 0) {  
        const beta = 0.1 * hit.depth / TIMESTEP;
        const lambda = -(this.vel.dot(hit.normal) - beta);
        this.vel = this.vel.add(hit.normal.mulf(lambda));
      }
    }
    
    for (const titan of titans) {
      if (!titan.alive)
        continue;
      const hit = check_circle(this.pos, 0.1, titan.pos, titan.radius);
      
      if (hit.depth > 0) {  
        const beta = 0.5 * hit.depth / TIMESTEP;
        const lambda = -(this.vel.dot(hit.normal) - beta);
        this.vel = this.vel.add(hit.normal.mulf(lambda));
      }
      
      const nape_hit = check_circle(this.pos, 0.1, titan.get_nape(), 0.3);
      if (nape_hit.depth > 0) {
        titan.alive = false;
        kills.innerHTML += "<BR>" + Math.floor(this.vel.length() * 1.1 * 100);
        // no i cant be bothered to release hook when titan dies
      }
    }
  }
  
  gas(gas_dir)
  {
    this.is_gas = true;
    this.vel = this.vel.add(gas_dir.mulf(TIMESTEP));
  }
  
  reel_out()
  {
    this.is_reel_out = true;
  }
  
  is_perp(hook)
  {
    if (hook.anchor) {
      const dist_pos = this.pos.dot(this.vel);
      const dist_hook = hook.pos.dot(this.vel);
      
      return dist_pos > dist_hook;
    } else {
      return false;
    }
  }
};

class titan_t {
  constructor(pos, radius)
  {
    this.pos = pos;
    this.radius = radius;
    this.dir = rand() * Math.PI;
    this.alive = true;
  }
  
  get_nape()
  {
    return this.pos.add(new vec2_t(-this.radius, 0).rotate(this.dir));
  }
};

class tree_t {
  constructor(pos, radius)
  {
    this.pos = pos;
    this.radius = radius;
  }
};

const TIMESTEP = 0.015;
const TIMESCALE = 1.0;

const cam = new cam_t(10.0);
const pen = new pen_t(document.getElementById("display"), cam);
const input = new input_t(document.getElementById("display"));

const pain = new pain_t();
const trees = [];
const titans = [];

const MODE_ORIGINAL = 0;
const MODE_TPS = 1;

let cam_mode = MODE_ORIGINAL;

function main()
{
  pain.vel = new vec2_t(0, 0);
  
  spawn_trees();
  spawn_titans();
  
  input.bind(key_t.code("C"), function() {
    cam_mode = (cam_mode + 1) % 2;
    switch (cam_mode) {
    case MODE_ORIGINAL:
      input.unlock();
      break;
    case MODE_TPS:
      input.lock();
      break;
    }
  });
  
  input.bind(key_t.code("T"), function() {
    pain.pos = new vec2_t();
    pain.vel = new vec2_t();
    pain.hook.release();
    pain.hook_b.release();
    spawn_titans();
    start_time = new Date();
  });
}

function spawn_trees()
{
  for (let i = 0; i < 43; i++) {
    let rand_pos;
    let should_spawn = false;
    let tries = 0;
    
    do {
      rand_pos = new vec2_t(rand() * (map_range - 2) * 2, rand() * (map_range - 2) * 2);
      should_spawn = true;
      for (let j = 0; j < trees.length; j++) {
        if (rand_pos.sub(trees[j].pos).length() < 5)
          should_spawn = false;
      }
      tries++;
    } while (!should_spawn && tries < 10);
    trees.push(new tree_t(rand_pos, 0.5 + rand() * 0.1));
  }
}

function spawn_titans()
{
  for (let i = 0; i < 10; i++) {
    let rand_pos;
    let should_spawn = false;
    let tries = 0;
    
    do {
      rand_pos = new vec2_t(rand() * (map_range - 2) * 2, rand() * (map_range - 2) * 2);
      should_spawn = true;
      for (let j = 0; j < trees.length; j++) {
        if (rand_pos.sub(trees[j].pos).length() < 1)
          should_spawn = false;
      }
      for (let j = 0; j < titans.length; j++) {
        if (rand_pos.sub(titans[j].pos).length() < 3)
          should_spawn = false;
      }
      tries++;
    } while (!should_spawn && tries < 10);
    titans[i] = new titan_t(rand_pos, 0.5 + rand() * 0.1);
  }
}

let prev_wheel = 0;

let start_time = new Date();

function update()
{
  let hook_dir;
  
  const elapsed_time = new Date() - start_time;
  document.getElementById("time").innerHTML = format_time(elapsed_time);
  
  const SENSITIVITY = 0.1;
  if (cam_mode == MODE_ORIGINAL) {
    const mouse_pos = cam.from_cam_space(input.mouse_pos().rotate(cam.rot));
    hook_dir = mouse_pos.sub(pain.pos).normalize();
  } else {
    cam.rot = -input.mouse_pos().x * SENSITIVITY * 10;
    hook_dir = new vec2_t(0, 1).rotate(cam.rot).normalize();
  }
  
  if (input.get_key(key_t.code("E"))) {
    if (!pain.hook.active) {
      pain.hook.shoot(pain.pos, hook_dir.mulf(30));
    }
  } else {
    if (pain.hook.active)
      pain.hook.release();
  }
  
  if (input.get_key(key_t.code("Q"))) {
    if (!pain.hook_b.active) {
      pain.hook_b.shoot(pain.pos, hook_dir.mulf(30));
    }
  } else {
    if (pain.hook_b.active)
      pain.hook_b.release();
  }
  
  let move_dir = new vec2_t();
  if (input.get_key(key_t.code("W")))
    move_dir = move_dir.add(new vec2_t(0, +1));
  if (input.get_key(key_t.code("A")))
    move_dir = move_dir.add(new vec2_t(-1, 0));
  if (input.get_key(key_t.code("S")))
    move_dir = move_dir.add(new vec2_t(0, -1));
  if (input.get_key(key_t.code("D")))
    move_dir = move_dir.add(new vec2_t(+1, 0));
  move_dir = move_dir.rotate(cam.rot);
  
  if (input.get_wheel() != prev_wheel) {
    const delta_wheel = input.get_wheel() - prev_wheel;
    if (delta_wheel < 0)
      pain.reel_in();
    else if (delta_wheel > 0)
      pain.reel_out();
    prev_wheel = input.get_wheel();
  }
  
  let titan_sum = 0;
  for (const titan of titans) {
    if (titan.alive)
      titan_sum++;
  }
  document.getElementById("count").innerHTML = "titans: " + titan_sum + "/10";
  
  if (input.get_key(key_t.SHIFT))
    pain.gas(move_dir);
  if (input.get_key(key_t.ALT))
    pain.reel_out();
  if (input.get_key(key_t.code(" ")))
    pain.reel_in();
  
  pain.update(trees, titans);
  cam.pos = pain.pos;
}

function draw()
{
  pen.color("blue");
  pen.circle(pain.pos, 0.1);
  
  if (cam_mode == MODE_TPS) {
    pen.line(pain.pos, pain.pos.add(new vec2_t(0, 10).rotate(cam.rot)));
  }
  
  pen.color("black");
  if (pain.hook.active) {
    pen.line(pain.pos, pain.hook.pos);
    pen.circle(pain.hook.pos, 0.05);
  }
  
  if (pain.hook_b.active) {
    pen.line(pain.pos, pain.hook_b.pos);
    pen.circle(pain.hook_b.pos, 0.05);
  }
  
  pen.color("red");
  for (const titan of titans) {
    if (!titan.alive)
      continue;
    pen.circle(titan.pos, titan.radius);
    pen.rect(titan.get_nape(), 0.3, 0.3);
  }
  
  pen.color("green");
  for (const tree of trees)
    pen.circle(tree.pos, tree.radius);
  
  pen.line(new vec2_t(-map_range, -map_range), new vec2_t(map_range, -map_range));
  pen.line(new vec2_t(map_range, -map_range), new vec2_t(map_range, map_range));
  pen.line(new vec2_t(map_range, map_range), new vec2_t(-map_range, map_range));
  pen.line(new vec2_t(-map_range, map_range), new vec2_t(-map_range, -map_range));
}

main();
setInterval(function() {
  pen.clear();
  update();
  draw();
}, TIMESTEP * 1000);

function format_time(elapsed_time)
{
  const minutes = Math.floor(elapsed_time / 60000) % 10;
  const seconds = Math.floor(elapsed_time / 1000) % 60;
  const miliseconds = Math.floor(elapsed_time / 10) % 100;
  
  return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + ":" + miliseconds.toString().padStart(2, "0");
}
