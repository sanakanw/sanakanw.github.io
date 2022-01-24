const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

function make_map(w, h)
{
  const map = [];
  
  for (let y = 0; y < h; y++) {
    map.push([]);
    for (let x = 0; x < w; x++) {
      map[y].push(0);
    }
  }
  
  return {
    map: map,
    width: w,
    height: h,
    get: function(x, y) {
      return this.map[y][x];
    },
    put: function(x, y) {
      this.map[y][x] = 1;
    }
  };
}

function line(x0, y0, x1, y1)
{
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function rect(x, y, w, h)
{
  ctx.fillRect(x, y, w, h);
}

function draw_map(map)
{
  const tile_width = canvas.width / map.width;
  const tile_height = canvas.height / map.height;
  
  for (let x = 0; x < canvas.width; x += tile_width)
    line(x, 0, x, canvas.height);
  for (let y = 0; y < canvas.width; y += tile_width)
    line(0, y, canvas.width, y);
  
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.get(x, y) == 1) {
        rect(
          x * tile_width,
          y * tile_height,
          tile_width,
          tile_height);
      }
    }
  }
}

function rand_int(n)
{
  return Math.floor(Math.random() * n);
}

function map_gen(map)
{
  const max_length = 8;
  const max_tunnel = 50;
  
  const directions = [
    [-1,  0],
    [+1,  0],
    [ 0, -1],
    [ 0, +1]
  ];
  
  let x = 2;
  let y = 2;
  
  let rand_dir = rand_int(directions.length);
  
  let num_tunnel = 0;
  while (num_tunnel < max_tunnel) {
    const rand_length = 1 + rand_int(max_length - 1);
    
    let tunnel_length = 0;
    while (tunnel_length < rand_length) {
      const xn = x + directions[rand_dir][0];
      const yn = y + directions[rand_dir][1];
      
      if (xn < 0 || yn < 0 || xn >= map.width || yn >= map.height)
        break;
      console.log(xn ,yn);
      
      x = xn;
      y = yn;
      
      map.put(x, y);
      tunnel_length++;
    }
    
    if (tunnel_length)
      num_tunnel++;
    
    let new_dir;
    do
      new_dir = rand_int(directions.length);
    while (new_dir == rand_dir);
    
    rand_dir = new_dir;
  }
}

function main()
{
  const map = make_map(20, 20);
  
  map_gen(map);
  
  draw_map(map);
}

main();
