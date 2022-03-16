"use strict";

import { vertex_t } from "./vertex.js";
import { vec3_t, plane_t } from "./math.js";
import { material_t, brush_t, face_t } from "./map.js";

const DOT_DEGREE = 0.001;

class bspnode_t {
  constructor(type, plane)
  {
    this.type = type;
    this.plane = plane;
    this.behind = null;
    this.ahead = null;
  }
}

class split_t {
  constructor(behind, ahead)
  {
    this.behind = behind;
    this.ahead = ahead;
  }
}

class splitbrush_t {
  constructor(faces, planes)
  {
    this.faces = faces;
    this.planes = planes;
  }
}

export class bsp_t {
  constructor(map_handle)
  {
    this.root = brush_collapse(new splitbrush_t(map_handle.brushes[0].faces, []));
    
    for (let i = 1; i < map_handle.brushes.length; i++)
      brush_insert_R(this.root, new splitbrush_t(map_handle.brushes[i].faces, []));
  }
}

function intersect_plane(a, b, plane)
{
  const delta_pos = b.pos.sub(a.pos);
  const delta_uv = b.uv.sub(a.uv);
  
  const t = -(a.pos.dot(plane.normal) - plane.distance) / delta_pos.dot(plane.normal);
  
  const pos = a.pos.add(delta_pos.mulf(t));
  const uv = a.uv.add(delta_uv.mulf(t));
  
  return new vertex_t(pos, uv);
}

function split_face_even(vbehind, vmiddle, vahead, plane, normal)
{
  const shared = intersect_plane(vbehind, vahead, plane);
  
  const behind = new face_t([vbehind, shared, vmiddle], normal);
  const ahead = new face_t([vahead, shared, vmiddle], normal);
  
  return new split_t([behind], [ahead]);
}

function split_face_uneven(vbase, vhead, plane, normal, flip)
{
  const hit_a = intersect_plane(vhead, vbase[0], plane);
  const hit_b = intersect_plane(vhead, vbase[1], plane);
  
  const head = [ new face_t([hit_a, hit_b, vhead], normal) ];
  
  const base = [
    new face_t([vbase[0], vbase[1], hit_b], normal),
    new face_t([hit_b, hit_a, vbase[0]], normal)
  ];
  
  if (flip)
    return new split_t(head, base);
  else
    return new split_t(base, head);
}

function split_face(face, plane)
{
  const behind = [];
  const middle = [];
  const ahead = [];
  
  for (const vertex of face.vertices) {
    const dist = vertex.pos.dot(plane.normal) - plane.distance;
    
    if (dist < -DOT_DEGREE) {
      behind.push(vertex);
    } else if (dist > +DOT_DEGREE) {
      ahead.push(vertex);
    } else {
      middle.push(vertex);
    }
  }
  
  if (behind.length == 3 || (behind.length == 2 && middle.length == 1)) {
    return new split_t([face], []);
  } else if (ahead.length == 3 || (ahead.length == 2 && middle.length == 1)) {
    return new split_t([], [face]);
  } else if (middle.length == 3) {
    if (face.normal.dot(plane.normal) > +DOT_DEGREE)
      return new split_t([], []);
    else
      return new split_t([], [face]);
  } else if (middle.length == 2) {
    if (behind.length > ahead.length)
      return new split_t([face], []);
    else
      return new split_t([], [face]);
  } else if (middle.length == 1) {
    return split_face_even(behind[0], middle[0], ahead[0], plane, face.normal);
  } else if (behind.length > ahead.length) {
    return split_face_uneven(behind, ahead[0], plane, face.normal, false);
  } else if (behind.length < ahead.length) {
    return split_face_uneven(ahead, behind[0], plane, face.normal, true);
  } else {
    throw "split_face(): unknown case";
  }
}

function split_brush(brush, plane)
{
  const faces_behind = [];
  const faces_ahead = [];
  
  for (const face of brush.faces) {
    const split = split_face(face, plane);
    
    faces_behind.push(...split.behind);
    faces_ahead.push(...split.ahead);
  }
  
  if (faces_behind.length == 0 || faces_ahead.length == 0) {
    if (faces_behind.length == brush.faces.length)
      return new split_t(brush, null);
    else if (faces_ahead.length == brush.faces.length)
      return new split_t(null, brush);
  }
  
  let brush_behind = null;
  if (faces_behind.length > 0) {
    const planes = brush.planes.slice();
    
    if (faces_ahead.length == 0)
      planes.push(plane);
    
    brush_behind = new splitbrush_t(faces_behind, planes);
  }
  
  let brush_ahead = null;
  if (faces_ahead.length > 0) {
    const planes = brush.planes.slice();
    
    if (faces_behind.length == 0)
      planes.push(new plane_t(plane.normal.mulf(-1), plane.distance));
    
    brush_ahead = new splitbrush_t(faces_ahead, planes);
  }
  
  return new split_t(brush_behind, brush_ahead);
}

function face_to_plane(face)
{
  const distance = face.vertices[0].pos.dot(face.normal);
  return new plane_t(face.normal, distance);
}

function brush_to_planes(brush)
{
  return brush.faces.map(face_to_plane);
}

function get_shared_vertices(a, b)
{
  let shared = [];
  for (const v1 of a.vertices) {
    for (const v2 of b.vertices) {
      const delta_pos = v1.pos.sub(v2.pos);
      
      if (delta_pos.dot(delta_pos) < DOT_DEGREE * DOT_DEGREE)
        shared.push(v1);
    }
  }
  
  return shared;
}

function gen_bevel_planes(brush)
{
  const COS_MAX_THETA = Math.cos(45 * Math.PI / 180.0);
  
  const bevel = [];
  
  for (let i = 0; i < brush.faces.length; i++) {
    for (let j = i + 1; j < brush.faces.length; j++) {
      const shared = get_shared_vertices(brush.faces[i], brush.faces[j]);
      if (shared.length == 2) {
        const d = brush.faces[i].normal.dot(brush.faces[j].normal);
        if (d < COS_MAX_THETA) {
          const normal = brush.faces[i].normal.add(brush.faces[j].normal).normalize();
          const distance = shared[0].pos.dot(normal) - 0.05;
          
          bevel.push(new plane_t(normal, distance));
        }
      }
    }
    
    for (const plane of brush.planes) {
      const shared = [];
      for (const v of brush.faces[i].vertices) {
        const dot = v.pos.dot(plane.normal) - plane.distance;
        
        if (Math.abs(dot) < +DOT_DEGREE)
          shared.push(v);
      }
      
      if (shared.length == 2) {
        const d = brush.faces[i].normal.dot(plane.normal);
        if (d < COS_MAX_THETA) {
          const normal = brush.faces[i].normal.add(plane.normal).normalize();
          const distance = shared[0].pos.dot(normal) - 0.1;
          
          bevel.push(new plane_t(normal, distance));
        }
      }
    }
  }
  
  return bevel;
}

function brush_collapse(brush)
{
  const brush_planes = brush_to_planes(brush);
  const bevel = gen_bevel_planes(brush);
  
  brush_planes.push(...bevel);
  
  const planes = [];
  
  for (let i = 0; i < brush_planes.length; i++) {
    let is_unique = true;
    for (let j = i + 1; j < brush_planes.length; j++) {
      const cos_normal = brush_planes[i].normal.dot(brush_planes[j].normal);
      
      if (cos_normal >= (1 - DOT_DEGREE))
        is_unique = false;
    }
    
    if (is_unique)
      planes.push(brush_planes[i]);
  }
  
  if (planes.length == 1) {
    return new bspnode_t(brush_t.BRUSH_SOLID, planes[0]);
  } else {
    const root = new bspnode_t(brush_t.BRUSH_EMPTY, planes[0]);
    
    let node = root;
    for (let i = 1; i < planes.length - 1; i++) {
      node.behind = new bspnode_t(brush_t.BRUSH_EMPTY, planes[i]);
      node = node.behind;
    }
    
    node.behind = new bspnode_t(brush_t.BRUSH_SOLID, planes[planes.length - 1]);
    
    return root;
  }
}

function brush_insert_R(node, brush)
{
  const split = split_brush(brush, node.plane);
  
  if (split.behind) {
    if (!node.behind)
      node.behind = brush_collapse(split.behind);
    else
      brush_insert_R(node.behind, split.behind);
  }
  
  if (split.ahead) {
    if (!node.ahead)
      node.ahead = brush_collapse(split.ahead);
    else
      brush_insert_R(node.ahead, split.ahead);
  }
}
