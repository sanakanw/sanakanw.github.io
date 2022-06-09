"use truct";

class texture_t {
  constructor(data, width, height)
  {
    this.data_u8 = new Uint8Array(data);
    this.data_u32 = new Uint32Array(this.data_u8);
    this.width = width;
    this.height = height;
  }
  
  get(x, y) {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height)
      return this.data_u32[x + y * this.width];
    else
      return this.data_u32[(x % this.width) + (y % this.height) * this.width];
  }
  
  get_rgb(x, y)
  {
    let i;
    if (x >= 0 && y >= 0 && x < this.width && y < this.height)
      i = (x + y * this.width) * 4;
    else
      i = ((x % this.width) + (y % this.height) * this.width) * 4;
    
    return [
      this.data_u8[i + 0],
      this.data_u8[i + 1],
      this.data_u8[i + 2]
    ];
  }
}

const assets = {};
let asset_count = 0;

export function texture_prepare(path)
{
  const img = new Image();
  img.src = path;
  
  asset_count++;
  
  img.onload = function() {
    const width = img.width;
    const height = img.height;
    
    const c = document.createElement("CANVAS");
    c.width = width;
    c.height = height;
    
    const ctx = c.getContext("2d");
    
    ctx.drawImage(img, 0, 0, width, height);
    
    const image_data = ctx.getImageData(0, 0, width, height);
    const data = image_data.data;
    
    assets[path] = new texture_t(data.buffer, width, height);
  };
}

export function texture_status()
{
  return Object.keys(assets).length == asset_count;
}

export function texture_load(path)
{
  return assets[path];
}
