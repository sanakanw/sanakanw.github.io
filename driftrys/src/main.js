import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { map_t } from "./map.js";
import { input_t } from "./input.js";
import { car_t } from "./car.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
const input = new input_t(renderer.domElement);
const loader = new GLTFLoader();
const car = new car_t();
const map = new map_t();
const listener = new THREE.AudioListener();

function init()
{
  camera.add(listener);
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.append(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  car.init_mesh(scene, loader);
  car.init_snd(listener);
  car.init_particle(scene);
  map.load_map("dr_track_1", scene, loader);
  car.set_map("dr_track_1");
  // init_bgm();
  
  input.bind("T", () => {
    const map_name = "dr_track_" + prompt("MAP NO.");
    map.load_map(map_name, scene, loader);
    car.set_map(map_name);
    car.reset();
  });
}

function update()
{
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
  car.brake(input.get_key(" "));
  
  car.update(map);
  
  const vel_dir_bias = car.vel.clone().normalize().add(car.dir).normalize();
  const cam_pos = car.pos.clone().add(vel_dir_bias.multiplyScalar(-7)).add(new THREE.Vector3(0, 7, 0));
  const look_pos = car.pos.clone().add(new THREE.Vector3(0, 7, 0));
  
  camera.position.copy(cam_pos);
  camera.lookAt(look_pos);
  
  renderer.render(scene, camera);
}

function init_bgm()
{
  const sound = new THREE.Audio(listener);

  const audio_loader = new THREE.AudioLoader();
  audio_loader.load("assets/bgm.mp3", function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.25);
    sound.play();
  });
}

init();
setInterval(update, 15);
