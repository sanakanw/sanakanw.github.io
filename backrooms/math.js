"use strict";

export class vec2_t {
  constructor(x = 0, y = 0)
  {
    this.x = x;
    this.y = y;
  }
  
  dot(v)
  {
    return this.x * v.x + this.y * v.y;
  }
  
  length()
  {
    return Math.sqrt(this.dot(this));
  }
  
  normalize()
  {
    const length = this.length();
    
    return new vec2_t(
      this.x / length,
      this.y / length
    );
  }
  
  rotate(theta)
  {
    const cos_theta = Math.cos(theta);
    const sin_theta = Math.sin(theta);
    
    return new vec2_t(
      this.x * cos_theta - this.y * sin_theta,
      this.x * sin_theta + this.y * cos_theta
    );
  }
};
