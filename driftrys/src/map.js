"use strict";

import * as THREE from "three";
import { Plane } from "./dr_math.js";

function read_file(url, on_load)
{
  const req = new XMLHttpRequest();
  req.addEventListener("load", function() {
    on_load(this.responseText);
  });
  req.open("GET", url);
  req.send();
}

function make_plane(a, b)
{
  const d_pos = vec2_t.normalize(vec2_t.sub(a, b));
  const normal = vec2_t.cross_up(d_pos, -1);
  const dist = vec2_t.dot(normal, a);
  return new plane_t(normal, dist);
}

class segment_t {
  constructor(side_a, side_b, back) {
    this.side_a = side_a;
    this.side_b = side_b;
    this.back = back;
  }
};

function parse_plane(obj_plane)
{
  const normal = new THREE.Vector3(obj_plane.normal.x, 0, obj_plane.normal.y);
  const distance = obj_plane.distance;
  
  return new Plane(normal, distance);
}

function parse_segment(obj_segment)
{
  const side_a = parse_plane(obj_segment.side_a);
  const side_b = parse_plane(obj_segment.side_b);
  const back = parse_plane(obj_segment.back);
  
  return new segment_t(side_a, side_b, back);
}

export class map_t {
  mesh;
  segments;
  
  constructor()
  {
    this.mesh = null;
    this.segments = null;
  }
  
  load_map(map_path, scene, loader)
  {
    if (this.mesh) {
      this.mesh.parent.remove(this.mesh);
      for (const child of this.mesh.children) {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      }
    }
    
    this.init_track("assets/" + map_path + "/scene.track");
    this.init_mesh("assets/" + map_path + "/scene.glb", scene, loader);
  }
  
  init_track(track_path)
  {
    this.segments = [];
    
    read_file(track_path, (body) => {
      const track = JSON.parse(body);
      
      for (const segment of track.segments)
        this.segments.push(parse_segment(segment));
    });
  }
  
  init_mesh(mdl_path, scene, loader)
  {
    loader.load(mdl_path, (gltf) => {
      this.mesh = gltf.scene;
      scene.add(this.mesh);
    }, undefined, function (error) {
      console.error(error);
    });
  }
  
  check_point(segment_id, pos)
  {
    const segment = this.segments[segment_id];
    
    const front_seg_id = (segment_id + 1) % this.segments.length;
    const front_plane = this.segments[front_seg_id].back.clone().flip();
    
    const clip_side_a = segment.side_a.projectVector3(pos);
    const clip_side_b = segment.side_b.projectVector3(pos);
    const clip_back = segment.back.projectVector3(pos);
    const clip_front = front_plane.projectVector3(pos);
    
    return clip_side_a > 0 && clip_side_b > 0 && clip_back > 0 && clip_front > 0;
  }
}

