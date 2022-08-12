"use strict";

import * as THREE from "three";

export class map_t {
  constructor(car)
  {
    this.car = car;
    this.turns = [];
    
    this.turns.push(new THREE.Vector3(0, 0, 0));
    
    const max_theta = 110;
    let turn_dir = new THREE.Vector3(0, 0, 30);
    for (let i = 0; i < 100; i++) {
      this.turns.push(this.turns[i].clone().add(turn_dir));
      const turn_rotation = new THREE.Euler(0, (Math.random() - 0.5) * max_theta * Math.PI / 180.0, 0);
      turn_dir.applyEuler(turn_rotation);
    }
  }
  
  init_mesh(scene)
  {
    const ROAD_WIDTH = 15;
    
    const points = [];
    
    const side_begin = new THREE.Vector3(0, ROAD_WIDTH, 0).cross(new THREE.Vector3().subVectors(this.turns[1], this.turns[0]).normalize());
    
    let old_left = this.turns[0].clone().add(side_begin);
    let old_right = this.turns[0].clone().sub(side_begin);
    
    for (let i = 1; i < this.turns.length; i++) {
      const a = this.turns[i - 1];
      const b = this.turns[i];
      
      const side = new THREE.Vector3(0, ROAD_WIDTH, 0).cross(new THREE.Vector3().subVectors(b, a).normalize());
      
      const a_left = old_left;
      const a_right = old_right;
      
      const b_left = b.clone().add(side);
      const b_right = b.clone().sub(side);
      
      points.push(b_left);
      points.push(a_left);
      points.push(a_right);
      points.push(b_right);
      points.push(b_left);
      
      old_left = b_left;
      old_right = b_right;
    }
    
    const material = new THREE.LineBasicMaterial( { color: 0xff0ff } );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }
}

