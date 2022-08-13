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

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.append(renderer.domElement);

car.init_mesh(scene, loader);
map.load_map("assets/dr_track_1", scene, loader);

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
scene.add( ambientLight );

function update()
{
  car.reset_forces();
  car.drag();
  
  if (input.get_key("W"))
    car.accel(50);
  if (input.get_key("J"))
    car.accel(80);
  if (input.get_key("S"))
    car.accel(-10);
  if (input.get_key("A"))
    car.steer(+0.4);
  if (input.get_key("D"))
    car.steer(-0.4);
  car.brake(input.get_key(" "));
  
  car.wheel_reset();
  car.wheel_forces();
  car.update_mesh();
  car.clip_map(map);
  car.integrate();
  
  const vel_dir_bias = car.vel.clone().normalize().add(car.dir).normalize();
  const cam_pos = car.pos.clone().add(vel_dir_bias.multiplyScalar(-7)).add(new THREE.Vector3(0, 7, 0));
  const look_pos = car.pos.clone().add(new THREE.Vector3(0, 7, 0));
  
  camera.position.copy(cam_pos);
  camera.lookAt(look_pos);
  
  renderer.render(scene, camera);
}

setInterval(update, 15);
