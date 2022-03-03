"use strict";

export function sumOfArray(array)
{
  let sum = 0;
  for (let i = 0; i < array.length; i++)
    sum += array[i];
  return sum;
}

export class Vector2 {
  constructor(x = 0.0, y = 0.0)
  {
    this.x = x;
    this.y = y;
  }
  
  add(v)
  {
    return new Vector2(
      this.x + v.x,
      this.y + v.y
    );
  }
  
  mul(v)
  {
    return new Vector2(
      this.x * v.x,
      this.y * v.y
    );
  }
  
  mulf(f)
  {
    return new Vector2(
      this.x * f,
      this.y * f
    );
  }
}

export class Vector3 {
  constructor(x = 0.0, y = 0.0, z = 0.0)
  {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  add(v)
  {
    return new Vector3(
      this.x + v.x,
      this.y + v.y,
      this.z + v.z
    );
  }
  
  mul(v)
  {
    return new Vector3(
      this.x * v.x,
      this.y * v.y,
      this.z * v.z
    );
  }
  
  zRotate(theta)
  {
    const zCos = Math.cos(theta);
    const zSin = Math.sin(theta);
    
    return new Vector3(
      this.x * zCos - this.y * zSin,
      this.x * zSin + this.y * zCos,
      this.z);
  }
  
  mulf(f)
  {
    return new Vector3(
      this.x * f,
      this.y * f,
      this.z * f
    );
  }
}

export class Matrix4 {
  constructor()
  {
    this.m = new Float32Array(4 * 4);
  }
  
  mul(b)
  {
    const r = new Matrix4();
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        r.m[i * 4 + j] = b.m[0 * 4 + j] * this.m[i * 4 + 0] +
                         b.m[1 * 4 + j] * this.m[i * 4 + 1] +
                         b.m[2 * 4 + j] * this.m[i * 4 + 2] +
                         b.m[3 * 4 + j] * this.m[i * 4 + 3];
                      
      }
    }
    
    return r;
  }
  
  static initIdentity()
  {
    const m = new Matrix4();
    
    m.m[0] = 1; m.m[4]  = 0; m.m[8]  = 0; m.m[12] = 0;
    m.m[1] = 0; m.m[5]  = 1; m.m[9]  = 0; m.m[13] = 0;
    m.m[2] = 0; m.m[6]  = 0; m.m[10] = 1; m.m[14] = 0;
    m.m[3] = 0; m.m[7]  = 0; m.m[11] = 0; m.m[15] = 1;
    
    return m;
  }
  
  static initTranslation(v)
  {
    const m = new Matrix4();
    
    m.m[0] = 1; m.m[4]  = 0; m.m[8]  = 0; m.m[12] = v.x;
    m.m[1] = 0; m.m[5]  = 1; m.m[9]  = 0; m.m[13] = v.y;
    m.m[2] = 0; m.m[6]  = 0; m.m[10] = 1; m.m[14] = v.z;
    m.m[3] = 0; m.m[7]  = 0; m.m[11] = 0; m.m[15] = 1;
    
    return m;
  }
  
  static initOrthogonal(l, r, t, b, n, f)
  {
    const m = new Matrix4();
    
    m.m[0] = 2 / (r - l);   m.m[4] = 0;             m.m[8]  = 0;            m.m[12] = -(r + l) / (r - l);
    m.m[1] = 0;             m.m[5] = 2 / (t - b);   m.m[9]  = 0;            m.m[13] = -(t + b) / (t - b);
    m.m[2] = 0;             m.m[6] = 0;             m.m[10] = -2 / (f - n); m.m[14] = -(f + n) / (f - n);
    m.m[3] = 0;             m.m[7] = 0;             m.m[11] = 0;            m.m[15] = 1;
    
    return m;
  }
  
  static initOrthogonalPerspective(l, r, t, b, n, f)
  {
    const m = new Matrix4();
    
    m.m[0] = 2 / (r - l);   m.m[4] = 0;             m.m[8]  = 0;            m.m[12] = -(r + l) / (r - l);
    m.m[1] = 0;             m.m[5] = 2 / (t - b);   m.m[9]  = +2 / (f - n); m.m[13] = -(t + b) / (t - b);
    m.m[2] = 0;             m.m[6] = 0;             m.m[10] = -2 / (f - n); m.m[14] = -(f + n) / (f - n);
    m.m[3] = 0;             m.m[7] = 0;             m.m[11] = 0;            m.m[15] = 1;
    
    return m;
  }
  
  static initRotation(angle)
  {
    const m = new Matrix4();
    
    const sinRot = Math.cos(angle);
    const cosRot = Math.sin(angle);
    
    m.m[0] = +cosRot;   m.m[4]  = -sinRot;  m.m[8]  = 0; m.m[12] = 0;
    m.m[1] = +sinRot;   m.m[5]  = +cosRot;  m.m[9]  = 0; m.m[13] = 0;
    m.m[2] = 0;         m.m[6]  = 0;        m.m[10] = 1; m.m[14] = 0;
    m.m[3] = 0;         m.m[7]  = 0;        m.m[11] = 0; m.m[15] = 1;
    
    return m;
  }
}
