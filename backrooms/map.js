'use strict';

function rand_int(n)
{
  return Math.floor(Math.random() * n);
}

export class map_t {
  constructor(width, height)
  {
    this.width = width;
    this.height = height;
    this.map = new Uint8Array(this.width * this.height);
    
    for (let i = 0; i < this.map.length; i++)
      this.map[i] = 1;
    
    this.gen();
  }
  
  collide(x, y)
  {
    const box = [
      [ -0.2, -0.2 ],
      [ +0.2, -0.2 ],
      [ -0.2, +0.2 ],
      [ +0.2, +0.2 ]
    ];
    
    for (let i = 0; i < box.length; i++) {
      const xcheck = Math.floor(x + box[i][0]);
      const ycheck = Math.floor(y + box[i][1]);
      
      if (this.get(xcheck, ycheck) == 1)
        return true;
    }
    
    return false;
  }
  
  gen(max_tunnel, max_length, xpos, ypos)
  {
    const dir = [
      [-1,  0],
      [+1,  0],
      [ 0, -1],
      [ 0, +1]
    ];
    
    let rand_dir = rand_int(dir.length);
    
    let num_tunnel = 0;
    while (num_tunnel < max_tunnel) {
      const rand_length = 1 + rand_int(max_length - 1);
      
      let tunnel_length = 0;
      while (tunnel_length < rand_length) {
        this.put(0, xpos, ypos);
        const xnew = xpos + dir[rand_dir][0];
        const ynew = ypos + dir[rand_dir][1];
        
        if (xnew < 0 || ynew < 0 || xnew >= this.width || ynew >= this.height)
          break;
        
        xpos = xnew;
        ypos = ynew;
        
        tunnel_length++;
      }
      
      if (tunnel_length)
        num_tunnel++;
      
      let new_dir;
      do
        new_dir = rand_int(dir.length);
      while (new_dir == rand_dir);
      
      rand_dir = new_dir;
    }
  }
  
  put(tile, x, y)
  {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height)
      this.map[x + y * this.width] = tile;
  }
  
  get(x, y)
  {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      return 1;
    
    return this.map[x + y * this.width];
  }
};
