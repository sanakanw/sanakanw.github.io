"use strict";

function align(x, alignment)
{
  return Math.floor(x / alignment);
}

export class sizeof {
  static U8       = 1;
  static U16      = 2;
  static U32      = 4;
  static F32      = 4;
  static SZ32     = 32;
  static LUMP     = 2 * sizeof.U32;
};

export class lump_t {
  fileofs;
  filelen;
  
  constructor(fileofs, filelen)
  {
    this.fileofs = fileofs;
    this.filelen = filelen;
  }
};

export class write_t {
  b;
  b_u8;
  b_u16;
  b_u32;
  b_f32;
  pos;
  max_pos;
  
  constructor()
  {
    this.b = new ArrayBuffer(8);
    this.reset();
    
    this.pos = 0;
    this.max_pos = this.pos;
  }
  
  data()
  {
    const new_b = new ArrayBuffer(this.max_pos + 1);
    const new_b_u8 = new Uint8Array(new_b);
    
    for (let i = 0; i < this.max_pos; i++)
      new_b_u8[i] = this.b_u8[i];
    
    return new_b;
  }
  
  reset()
  {
    this.b_u8 = new Uint8Array(this.b);
    this.b_u16 = new Uint16Array(this.b);
    this.b_u32 = new Uint32Array(this.b);
    this.b_f32 = new Float32Array(this.b);
  }
  
  grow()
  {
    const new_b = new ArrayBuffer(2 * this.b.byteLength);
    new Uint8Array(new_b).set(this.b_u8);
    this.b = new_b;
    this.reset();
  }
  
  seek(pos)
  {
    this.pos = pos;
    
    if (this.pos > this.max_pos)
      this.max_pos = this.pos;
    
    while (pos >= this.b.byteLength)
      this.grow();
  }
  
  tell()
  {
    return this.pos;
  }
  
  emit_u8(u8)
  {
    this.b_u8[align(this.pos, sizeof.U8)] = u8|0;
    this.seek(this.pos + sizeof.U8);
  }
  
  emit_u16(u16)
  {
    this.b_u16[align(this.pos, sizeof.U16)] = u16|0;
    this.seek(this.pos + sizeof.U16);
  }
  
  emit_u32(u32)
  {
    this.b_u32[align(this.pos, sizeof.U32)] = u32|0;
    this.seek(this.pos + sizeof.U32);
  }
  
  emit_f32(f32)
  {
    this.b_f32[align(this.pos, sizeof.F32)] = f32;
    this.seek(this.pos + sizeof.F32);
  }
  
  emit_sz32(sz32)
  {
    const sz_pos = Math.min(sz32.length, 31);
    for (let i = 0; i < sz_pos; i++)
      this.emit_u8(sz32.charCodeAt(i));
    
    for (let i = sz_pos; i < 32; i++)
      this.emit_u8(0);
  }
  
  emit_lump(lump)
  {
    this.emit_u32(lump.fileofs);
    this.emit_u32(lump.filelen);
  }
};
