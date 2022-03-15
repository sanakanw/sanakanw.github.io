"use strict";

import fs from 'fs';
import path from 'path';

import { vertex_t } from "../client/src/common/vertex.js";
import { vec2_t, vec3_t } from "../client/src/common/math.js";
import { brushgroup_t, material_t, face_t, brush_t, map_t } from "../client/src/common/map.js";

class mtl_t {
  constructor(name, material)
  {
    this.name = name;
    this.material = material;
  }
}

class mtldict_t {
  constructor(mtls)
  {
    this.mtls = mtls;
  }
  
  find_id(name)
  {
    for (let i = 0; i < this.mtls.length; i++) {
      if (this.mtls[i].name == name)
        return i;
    }
  }
}

class brushmtl_t {
  constructor(brush, id_material)
  {
    this.brush = brush;
    this.id_material = id_material;
  }
}

function main()
{
  if (process.argv.length != 3) {
    console.log("usage: node tiled.js [map-name]");
    process.exit(1);
  }
  
  const map_name = process.argv[2];
  
  const obj_path = path.parse(path.join(".", "obj", map_name + ".obj"));
  const map = parse_obj(obj_path);
  
  const map_path = path.join("..", "client", "asset", "map", obj_path.name + ".json");
  const map_json = JSON.stringify(map); 
  
  fs.writeFileSync(map_path, map_json);
}

function parse_mtl(mtl_path)
{
  const mtl = fs.readFileSync(path.join(mtl_path.dir, mtl_path.base)).toString();
  const lines = mtl.split('\n');
  
  const mtls = [];
  
  let name;
  let tex;
  
  for (const line of lines) {
    const args = line.split(' ').filter((x) => x.length > 0);
    
    if (args[0] == "newmtl") {
      if (name) {
        const material = new material_t(tex);
        mtls.push(new mtl_t(name, material));
      }
      
      name = args[1];
    } else if (args[0] == "map_Kd") {
      const tex_path = path.parse(args[1]);
      tex = path.join("asset", "mtl", tex_path.base);
    }
  }
  
  if (name) {
    const material = new material_t(tex);
    mtls.push(new mtl_t(name, material));
  }
  
  return new mtldict_t(mtls);
}

function parse_obj(obj_path)
{
  const obj = fs.readFileSync(path.join(obj_path.dir, obj_path.base)).toString();
  const lines = obj.split('\n');
      
  const vbuf = [];
  const vtbuf = [];
  const vnbuf = [];
  
  let fbuf = [];
  let id_material;
  let mtldict;
  
  const brushmtls = [];
  
  for (const line of lines) {
    const args = line.split(' ');
    
    if (args[0] == "o") {
      if (fbuf.length > 0) {
        const brush = new brush_t(fbuf);
        brushmtls.push(new brushmtl_t(brush, id_material));
      }
      
      fbuf = [];
    } if (args[0] == "mtllib") {
      const mtl_path = path.parse(path.join(obj_path.dir, obj_path.name + ".mtl"));
      mtldict = parse_mtl(mtl_path);
    } else if (args[0] == "usemtl") {
      const mtl_name = args[1];
      id_material = mtldict.find_id(mtl_name);
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
          1 - parseFloat(args[2])
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
        
        const id_v = face_data[0] - 1;
        const id_vt = face_data[1] - 1;
        const id_vn  = face_data[2] - 1;
        
        vertices.push(new vertex_t(vbuf[id_v], vtbuf[id_vt]));
        normals.push(vnbuf[id_vn]);
      }
      
      const normal = normals[0].normalize();
      
      fbuf.push(new face_t(vertices, normal));
    }
  }
  
  if (fbuf.length > 0) {
    const brush = new brush_t(fbuf);
    brushmtls.push(new brushmtl_t(brush, id_material));
    fbuf = [];
  }
  
  const brushes = [];
  const materials = [];
  const brushgroups = [];
  
  let brushofs = 0;
  let brushend = brushofs;
  while (brushofs != brushmtls.length) {
    brushes.push(brushmtls[brushend].brush);
    
    for (let j = brushend + 1; j < brushmtls.length; j++) {
      if (brushmtls[brushend].id_material == brushmtls[j].id_material) {
        brushend++;
        
        const tmp = brushmtls[brushend];
        brushmtls[brushend] = brushmtls[j];
        brushmtls[j] = tmp;
        
        brushes.push(brushmtls[brushend].brush);
      }
    }
    
    brushend++;
    const id_material = brushmtls[brushofs].id_material;
    brushgroups.push(new brushgroup_t(id_material, brushofs, brushend));
    
    brushofs = brushend;
  }
  
  for (const mtl of mtldict.mtls)
    materials.push(mtl.material);
  
  return new map_t(brushes, brushgroups, materials);
}

main();
