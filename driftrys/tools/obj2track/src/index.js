import fs from "fs";
import path from "path";

import { vec2_t, plane_t } from "../../lib/math.js";

function make_plane(a, b)
{
  const d_pos = a.sub(b).normalize();
  const normal = d_pos.cross_up(-1);
  const dist = normal.dot(a);
  return new plane_t(normal, dist);
}

class segment_t {
  constructor(side_a, side_b, back) {
    this.side_a = side_a;
    this.side_b = side_b;
    this.back = back;
  }
};

function parse_obj(str_path)
{
  const dir = path.parse(str_path).dir;
  
  const file = fs.readFileSync(str_path).toString();
  const lines = file.split('\n');
  
  const faces = [];
  const vertices = [];
  
  for (const line of lines) {
    const args = line.split(' ').filter((x) => x.length > 0);
    
    if (args[0] == 'v') {
      vertices.push(
        new vec2_t(
          parseFloat(args[1]),
          parseFloat(args[3])));
    } else if (args[0] == "f") {
      faces.push([
        vertices[parseInt(args[1]) - 1],
        vertices[parseInt(args[2]) - 1],
        vertices[parseInt(args[3]) - 1],
        vertices[parseInt(args[4]) - 1]
      ]);
    }
  }
  
  return faces;
}

class track_t {
  constructor(vertices, segments)
  {
    this.vertices = vertices;
    this.segments = segments;
  }
};

function intersect_plane(a, b, plane)
{
  const delta_pos = b.sub(a);
  const t = -(a.dot(plane.normal) - plane.distance) / delta_pos.dot(plane.normal);
  const pos = a.add(delta_pos.mulf(t));
  
  return pos;
}

function obj_to_track(obj)
{
  const segments = [];
  const vertices = [];
  
  for (const face of obj) {
    vertices.push(...[face[0], face[1], face[2], face[3]]);
    
    const back = make_plane(face[3], face[0]);
    const side_a = make_plane(face[2], face[3]);
    const side_b = make_plane(face[0], face[1]);
    
    const seg_angle = side_a.normal.dot(side_b.normal);
    if (seg_angle > 0) {
      // length of side_a < side_b makes side_a flip conjecture
      // written 15.08.2022 lol
      // pls dont be wrong
      console.log("sharp turn warning at:", segments.length);
      if (face[2].sub(face[3]).length() < face[0].sub(face[1]).length()) {
        side_a.normal = side_a.normal.mulf(-1);
        side_a.distance = -side_a.distance;
      } else {
        side_b.normal = side_b.normal.mulf(-1);
        side_b.distance = -side_b.distance;
      }
    }
    
    segments.push(new segment_t(side_b, side_a, back));
  }
  
  return new track_t(vertices, segments);
}

function main()
{
  if (process.argv.length != 4) {
    console.log("usage:", path.parse(process.argv[1]).name, "[obj] [track]");
    process.exit(1);
  }
  
  const obj_path = process.argv[2];
  const track_path = process.argv[3];
  
  const obj = parse_obj(obj_path);
  const track = obj_to_track(obj);
  
  fs.writeFile(track_path, JSON.stringify(track), function(err, data) {
    if (err) {
      return console.log(err);
    }
    if (data)
      console.log(data);
  });
}

main();