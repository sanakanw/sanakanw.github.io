"use strict";

import fs from 'fs';
import path from 'path';

import { vec2_t, vec3_t } from "../client/src/common/math.js";
import { face_t, brush_t, map_t } from "../client/src/common/map.js";

function main()
{
  if (process.argv.length != 3) {
    console.log("usage: node tiled.js [map-name]");
    process.exit(1);
  }
  
  const map_name = process.argv[2];
  
  const obj_path = path.parse("./obj/" + map_name + ".obj");
  
  const obj = fs.readFileSync(obj_path.dir + "/" + obj_path.base).toString();
  const brushes = parse_obj(obj);
  
  const map_path = "../client/assets/" + obj_path.name + ".json";
  const map_json = JSON.stringify(brushes); 
  
  fs.writeFileSync(map_path, map_json);
}

function parse_obj(obj)
{
  const lines = obj.split('\n');
      
  const vbuf = [];
  const vtbuf = [];
  const vnbuf = [];
  
  let fbuf = [];
  
  const brushes = [];
  
  for (const line of lines) {
    const args = line.split(' ');
    
    if (args[0] == "o" && fbuf.length > 0) {
      brushes.push(new brush_t(fbuf));
      fbuf = [];
    } else if (args[0] == "v") {
      vbuf.push(
        new vec3_t(
          parseFloat(args[1]),
          parseFloat(args[2]),
          parseFloat(args[3])
        ));
    } else if (args[0] == "vt") {
      vtbuf.push(
        new vec2_t(
          parseFloat(args[1]),
          parseFloat(args[2])
        ));
    } else if (args[0] == "vn") {
      vnbuf.push(
        new vec3_t(
          parseFloat(args[1]),
          parseFloat(args[2]),
          parseFloat(args[3])
        ));
    } else if (args[0] == "f") {
      const vertices = [];
      const normals = [];
      
      for (let i = 1; i < 4; i++) {
        const face_data = args[i].split('/').map((x) => parseInt(x, 10));
        
        const vid = face_data[0] - 1;
        const vtid = face_data[1] - 1;
        const vnid  = face_data[2] - 1;
        
        vertices.push(vbuf[vid]);
        normals.push(vnbuf[vnid]);
      }
      
      fbuf.push(new face_t(vertices, normals[0]));
    }
  }
  
  if (fbuf.length > 0) {
    brushes.push(new brush_t(fbuf));
    fbuf = [];
  } 
  
  return new map_t(brushes);
}

main();
