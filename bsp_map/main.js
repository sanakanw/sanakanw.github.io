
let bsp_ctx;

let map_vertices = [];
let map_linedefs = [];
let map_ssectors = [];

let map_player = { x: 50, y: 50 };

let bsp_root;

let min_plane;
let min_depth;

let prev_vertex = -1;
let start_vertex = 0;

const player_radius = 5;

let prev_plane;

function add_vertex(x, y)
{
  let id = map_vertices.length;
  map_vertices.push({
    x: x,
    y: y
  });
  
  return id;
}

function add_linedef(a, b)
{
  let id = map_linedefs.length;
  map_linedefs.push({
    a: a,
    b: b
  });
  
  return id;
}

function add_ssector(start, end)
{
  let id = map_ssectors.length;
  map_ssectors.push({
    start: start,
    end: end
  });
  
  return id;
}

function bsp_node_t(plane)
{
  return {
    plane: plane,
    left: null,
    right: null
  };
}

function vec2(x, y)
{
  return {
    x: x,
    y: y
  };
}

function vec2_sub(a, b)
{
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

function vec2_dot(a, b)
{
  return a.x * b.x + a.y * b.y;
}

function vec2_length(v)
{
  return Math.sqrt(vec2_dot(v, v));
}

function vec2_normalize(v)
{
  let d = vec2_length(v);
  if (d != 0) {
    return {
      x: v.x / d,
      y: v.y / d
    };
  }
  
  return v;
}

function plane_t(n, d)
{
  return {
    n: n,
    d: d
  };
}

function fill_style(color)
{
  bsp_ctx.fillStyle = color;
  bsp_ctx.strokeStyle = color;
}

function d_line(x0, y0, x1, y1)
{
  bsp_ctx.beginPath();
  bsp_ctx.moveTo(x0, y0);
  bsp_ctx.lineTo(x1, y1);
  bsp_ctx.stroke();
  bsp_ctx.closePath();
}

function d_point(x, y)
{
  const point_size = 4;
  bsp_ctx.fillRect(
    x - point_size / 2,
    y - point_size / 2,
    point_size,
    point_size);
}

function d_ssector(ssector)
{
  /*
  bsp_ctx.beginPath();
  bsp_ctx.moveTo(
    map_vertices[map_linedefs[map_ssectors[ssector].start].a].x,
    map_vertices[map_linedefs[map_ssectors[ssector].start].a].y);
  
  for (let i = map_ssectors[ssector].start; i < map_ssectors[ssector].end; i++) {
    let a = map_linedefs[i].a;
    let b = map_linedefs[i].b;
    
    bsp_ctx.lineTo(map_vertices[b].x, map_vertices[b].y);
  }
  
  bsp_ctx.fill();
  bsp_ctx.closePath();
  */
}

function d_player()
{
  bsp_ctx.beginPath();
  bsp_ctx.arc(map_player.x, map_player.y, player_radius, 0, 2 * Math.PI);
  bsp_ctx.fill();
  bsp_ctx.closePath();
}

function d_linedef(line)
{
  let a = map_vertices[map_linedefs[line].a];
  let b = map_vertices[map_linedefs[line].b];
  
  d_line(a.x, a.y, b.x, b.y);
}

function d_vertex(vertex)
{
  d_point(map_vertices[vertex].x, map_vertices[vertex].y);
}

function d_plane(plane)
{
  let tangent = vec2(-plane.n.y, plane.n.x);
  
  let origin = vec2(plane.n.x * plane.d, plane.n.y * plane.d);
  
  const length = 1000;
  let a = vec2(origin.x - tangent.x * length, origin.y - tangent.y * length);
  let b = vec2(origin.x + tangent.x * length, origin.y + tangent.y * length);
  
  let c = vec2(origin.x + plane.n.x * length / 10, origin.y + plane.n.y * length / 10);
  
  d_point(origin.x, origin.y);
  
  d_line(a.x, a.y, b.x, b.y);
}

function update_map()
{
  bsp_ctx.clearRect(0, 0, bsp_ctx.canvas.width, bsp_ctx.canvas.height);
  
  if (bsp_root) {
    fill_style("#00ff00");
    d_player();
  }
  
  fill_style("#ff0000");
  for (let i = 0; i < map_ssectors.length; i++)
    d_ssector(i);
  
  fill_style("#ffffff");
  for (let i = 0; i < map_linedefs.length; i++)
    d_linedef(i);
  
  fill_style("#0000ff");
  for (let i = 0; i < map_vertices.length; i++)
    d_vertex(i);
  
}

function main()
{
  let c = get_node("display");
  bsp_ctx = c.getContext("2d");
  
  let ray_status = get_node("ray_status");
  
  c.addEventListener("mousedown", c_mouse_down);
  c.addEventListener("mousemove", c_mouse_move);
  document.addEventListener("keyup", dc_key_up);
  document.addEventListener("keydown", dc_key_down);
  get_node("gen").addEventListener("mousedown", gen_bsp);
  
  fill_style("#ffffff");
  setInterval(function() {
    if (bsp_root) {
      update_map();
      min_depth = -1000;
      let p1 = map_player;
      let p2 = cur_pos;
      
      fill_style("#ffffff");
      d_line(p1.x, p1.y, p2.x, p2.y);
      
      if (trace_bsp_r(bsp_root, p1, p2))
        ray_status.innerHTML = "HIT";
      else
        ray_status.innerHTML = "MISS";
      
      let new_pos = vec2(map_player.x, map_player.y);
      if (up)
        new_pos.y -= 1;
      if (down)
        new_pos.y += 1;
      if (left)
        new_pos.x -= 1;
      if (right)
        new_pos.x += 1;
      
      if (!walk_bsp_r(bsp_root, new_pos, player_radius))
        map_player = new_pos;
      else
        d_plane(min_plane);
    }
  }, 10);
}

function linedef_to_plane(line)
{
  let root = map_linedefs[line];
  
  let a = vec2(map_vertices[root.a].x, map_vertices[root.a].y);
  let b = vec2(map_vertices[root.b].x, map_vertices[root.b].y);
  
  let d = vec2_sub(a, b);
  
  let normal = vec2(-d.y, d.x);
  normal = vec2_normalize(normal);
  
  let dist = vec2_dot(a, normal);
  
  return plane_t(normal, dist);
}

function gen_bsp()
{
  bsp_root = null;
  for (let i = 0; i < map_linedefs.length; i++) {
    if (!bsp_root)
      bsp_root = bsp_node_t(linedef_to_plane(i));
    else
      bsp_insert_linedef_r(i, bsp_root);
  }
}

function walk_bsp_r(node, pos, radius)
{
  const delay = 700;
  
  let d = vec2_dot(node.plane.n, pos) - node.plane.d - radius;
  
  if (d > min_depth) {
    min_depth = d;
    min_plane = node.plane;
  }
  
  if (d < 0) {
    if (node.left)
      return walk_bsp_r(node.left, pos, radius);
    else
      return true;
  } else {
    if (node.right) {
      min_depth = -100;
      return walk_bsp_r(node.right, pos, radius);
    }
  }
  
  return false;
}

function trace_bsp_r(node, p0, p1)
{
  let d1 = vec2_dot(node.plane.n, p0) - node.plane.d;
  let d2 = vec2_dot(node.plane.n, p1) - node.plane.d;
  
  if (d1 < 0 && d2 < 0) {
    if (!node.left)
      return true;
    else
      return trace_bsp_r(node.left, p0, p1);
  } else if (d1 > 0 && d2 > 0) {
    if (!node.right)
      return false;
    else
      return trace_bsp_r(node.right, p0, p1);
  } else {
    let d = vec2_sub(p1, p0);
    let n = vec2_normalize(d);
    
    let t = -(vec2_dot(p0, node.plane.n) - node.plane.d) / vec2_dot(n, node.plane.n);
    
    let v = vec2(p0.x + n.x * t, p0.y + n.y * t);
    
    d_point(v.x, v.y);
    
    let r1, r2;
    if (d1 < 0) {
      if (node.left) r1 = trace_bsp_r(node.left, p0, v);
      else r1 = true;
      if (node.right) r2 = trace_bsp_r(node.right, v, p1);
      else r2 = false;
    } else {
      if (node.left) r1 = trace_bsp_r(node.left, v, p1);
      else r1 = true;
      if (node.right) r2 = trace_bsp_r(node.right, p0, v);
      else r2 = false;
    }
    return r1 || r2;
  }
}

function bsp_insert_left(line, node)
{
  if (node.left)
    bsp_insert_linedef_r(line, node.left);
  else
    node.left = bsp_node_t(linedef_to_plane(line));
}

function bsp_insert_right(line, node)
{
  if (node.right)
    bsp_insert_linedef_r(line, node.right);
  else
    node.right = bsp_node_t(linedef_to_plane(line));
}

function bsp_insert_linedef_r(line, node)
{
  let a = map_vertices[map_linedefs[line].a];
  let b = map_vertices[map_linedefs[line].b];
  
  let a_plane = Math.floor((vec2_dot(a, node.plane.n) - node.plane.d));
  let b_plane = Math.floor((vec2_dot(b, node.plane.n) - node.plane.d));
  
  if (a_plane <= 0 && b_plane <= 0) {
    bsp_insert_left(line, node);
  } else if (a_plane >= 0 && b_plane >= 0) {
    bsp_insert_right(line, node);
  } else {
    d_plane(node.plane);
    
    let p0 = a;
    let p1 = b;
    let d = vec2_sub(p1, p0);
    let n = vec2_normalize(d);
    
    let t = -(vec2_dot(p0, node.plane.n) - node.plane.d) / vec2_dot(n, node.plane.n);
    
    let v = vec2(p0.x + n.x * t, p0.y + n.y * t);
    
    d_point(v.x, v.y);
    
    let midpoint1 = add_vertex(v.x - n.x * 1.00, v.y - n.y * 1.00);
    let midpoint2 = add_vertex(v.x + n.x * 1.00, v.y + n.y * 1.00);
    
    if (map_vertices.length > 200) {
      console.log("abayo");
      return;
    }
    bsp_insert_left(add_linedef(map_linedefs[line].a, midpoint1), node);
    bsp_insert_right(add_linedef(midpoint2, map_linedefs[line].b), node);
  }
}

function find_close_vertex(xpos, ypos)
{
  const proximity = 20 * 20;
  
  for (let i = 0; i < map_vertices.length; i++) {
    let dx = xpos - map_vertices[i].x;
    let dy = ypos - map_vertices[i].y;
    
    let d = dx * dx + dy * dy;
    
    if (d < proximity) {
      return add_vertex(map_vertices[i].x, map_vertices[i].y);
    }
  }
  
  return -1;
}

let up = false;
let right = false;
let left = false;
let down = false;
function dc_key_down(e)
{
  switch (e.keyCode) {
  case 65: // A
    left = true;
    break;
  case 68: // D
    right = true;
    break;
  case 87: // W
    up = true;
    break;
  case 83: // S
    down = true;
    break;
  }
}

function dc_key_up(e)
{
  switch (e.keyCode) {
  case 65: // A
    left = false;
    break;
  case 68: // D
    right = false;
    break;
  case 87: // W
    up = false;
    break;
  case 83: // S
    down = false;
    break;
  }
}

let cur_pos = vec2(0, 0);

function c_mouse_move(e)
{
  if (bsp_root) {
    
    cur_pos = vec2(e.offsetX, e.offsetY);
  }
}

function c_mouse_down(e)
{
  if (bsp_root) {
    return;
  }
  
  let xpos = e.offsetX;
  let ypos = e.offsetY;
  
  let new_vertex;
  
  let nearby_vertex = find_close_vertex(xpos, ypos);
  if (nearby_vertex >= 0) {
    if (map_vertices.length == start_vertex)
      return;
    new_vertex = nearby_vertex;
  } else {
    new_vertex = add_vertex(xpos, ypos);
  }
  
  if (prev_vertex >= 0)
    add_linedef(prev_vertex, new_vertex);
  
  if (nearby_vertex >= 0) {
    prev_vertex = -1;
    add_ssector(start_vertex, map_vertices.length);
    start_vertex = map_vertices.length;
  } else {
    prev_vertex = new_vertex;
  }
  
  update_map();
}

function get_node(id)
{
  return document.getElementById(id);
}

(function()
{
  main();
})();
