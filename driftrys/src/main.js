import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { map_t } from "./map.js";
import { input_t } from "./input.js";
import { car_t } from "./car.js";

const GAME_STATE_LOAD = 0;
const GAME_STATE_MENU = 1;
const GAME_STATE_PLAY = 2;
const GAME_STATE_REPLAY = 3;

let game_state = GAME_STATE_LOAD;

const gui_hud = document.getElementById("hud");
const gui_menu = document.getElementById("menu");
const gui_load = document.getElementById("load");
const gui_replay = document.getElementById("replay");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
const input = new input_t(renderer.domElement);
const loader = new GLTFLoader();
const car = new car_t();
const map = new map_t();
const listener = new THREE.AudioListener();
const controls = new PointerLockControls(camera, document.body);

let mute_state = false;
let x_release = true; // bad code lol

let tick = 0;

function init()
{
  camera.add(listener);
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.append(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  car.init_mesh(scene, loader, () => {
    car.init_snd(listener, () => {
      map.load_map("dr_track_1", scene, loader, () => {
        load_state_menu();
        car.set_map("dr_track_1");
        init_bgm();
      })
    })
  });
  
  init_skybox();
}

function load_state_load(map_name)
{
  game_state = GAME_STATE_LOAD;
  
  map.load_map(map_name, scene, loader, () => {
    car.reset();
    car.set_map(map_name);
    load_state_play();
  });
  
  gui_load.style.display = "block";
  gui_menu.style.display = "none";
  gui_hud.style.display = "none";
  gui_replay.style.display = "none";
}

function load_state_menu()
{
  game_state = GAME_STATE_MENU;
  gui_menu.style.display = "block";
  gui_hud.style.display = "none";
  gui_replay.style.display = "none";
  gui_load.style.display = "none";
}

function load_state_play()
{
  game_state = GAME_STATE_PLAY;
  
  gui_hud.style.display = "block";
  gui_menu.style.display = "none";
  gui_replay.style.display = "none";
  gui_load.style.display = "none";
}

function load_state_replay()
{
  game_state = GAME_STATE_REPLAY;
  
  gui_replay.style.display = "block";
  gui_hud.style.display = "block";
  gui_menu.style.display = "none";
  gui_load.style.display = "none";
}

window.load_state_load = load_state_load;

function update()
{
  switch (game_state) {
  case GAME_STATE_MENU:
    game_menu();
    break;
  case GAME_STATE_LOAD:
    game_load();
    break;
  case GAME_STATE_PLAY:
    game_play();
    break;
  case GAME_STATE_REPLAY:
    game_replay();
    break;
  }
  
  renderer.render(scene, camera);
  
  tick++;
}

function game_load()
{
  
}

function game_menu()
{
  camera.position.set(0, 10, 0);
  camera.rotation.set(0, Math.cos(tick / 60.0) * 0.5, 0);
}

function game_play()
{
  if (input.get_key("T")) {
    load_state_replay();
    return;
  }
  
  if (input.get_key("P"))
    load_state_menu();
  
  car.reset_forces();
  car.drag();
  
  if (input.get_key("W"))
    car.accel(50);
  
  if (input.get_key("J"))
    car.accel(50);
  if (input.get_key("K"))
    car.accel(50);
  if (input.get_key("L"))
    car.accel(50);
  
  if (input.get_key("R"))
    car.reset();
  
  if (input.get_key("S"))
    car.accel(-10);
  if (input.get_key("A"))
    car.steer(+0.4);
  if (input.get_key("D"))
    car.steer(-0.4);
  
  if (car.track(map))
    load_state_replay();
  else 
    car.record();
  
  car.brake(input.get_key(" "));
  
  const vel_dir_bias = car.vel.clone().normalize().add(car.dir).normalize();
  const cam_pos = car.pos.clone().add(vel_dir_bias.multiplyScalar(-7)).add(new THREE.Vector3(0, 7, 0));
  const look_pos = car.pos.clone().add(new THREE.Vector3(0, 7, 0));
  
  camera.position.copy(cam_pos);
  camera.lookAt(look_pos);
  
  car.update(map);
}

function game_replay()
{
  if (input.get_key("P")) {
    controls.unlock();
    load_state_menu();
    return;
  }
  
  if (input.get_key("F"))
    controls.lock();
  
  if (input.get_key(" ")) {
    const vel_dir_bias = car.vel.clone().normalize().add(car.dir).normalize();
    const cam_pos = car.pos.clone().add(vel_dir_bias.multiplyScalar(-7)).add(new THREE.Vector3(0, 7, 0));
    const look_pos = car.pos.clone().add(new THREE.Vector3(0, 7, 0));
    
    camera.position.copy(cam_pos);
    camera.lookAt(look_pos);
  } else {
    if (input.get_key("G"))
      camera.lookAt(car.pos);
    
    if (input.get_key("W"))
      controls.moveForward(1);
    if (input.get_key("A"))
      controls.moveRight(-1);
    if (input.get_key("S"))
      controls.moveForward(-1);
    if (input.get_key("D"))
      controls.moveRight(1);
    if (input.get_key("Q"))
      camera.position.add(new THREE.Vector3(0, -1, 0));
    if (input.get_key("E"))
      camera.position.add(new THREE.Vector3(0, 1, 0));
  }
  
  if (input.get_key("X") && x_release) {
    gui_replay.style.display = gui_replay.style.display == "block" ? "none" : "block";
    gui_hud.style.display = gui_replay.style.display;
    x_release = false;
  } else if (!x_release && !input.get_key("X")) {
    x_release = true;
  }
  
  car.replay();
  car.update_snd();
  car.update_mesh();
}

function init_bgm()
{
  const sound = new THREE.Audio(listener);

  const audio_loader = new THREE.AudioLoader();
  audio_loader.load("assets/bgm.mp3", function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.15);
    sound.play();
  });
  
  input.bind("M", () => {
    sound.setVolume(mute_state ? 0.15 : 0);
    mute_state = !mute_state;
  });
}

function init_skybox()
{
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    "assets/night_skybox/left.png",
    "assets/night_skybox/right.png",
    "assets/night_skybox/up.png",
    "assets/night_skybox/down.png",
    "assets/night_skybox/front.png",
    "assets/night_skybox/back.png",
  ]);
  
  scene.background = texture;
}

window.addEventListener("resize", function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

init();

function animate() {
  update();
  window.requestAnimationFrame(animate);
}
animate();
