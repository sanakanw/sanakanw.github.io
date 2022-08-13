"use strict";

export class Plane {
  constructor(normal, distance)
  {
    this.normal = normal;
    this.distance = distance;
  }
  
  projectVector3(v)
  {
    return v.dot(this.normal) - this.distance;
  }
  
  clone()
  {
    return new Plane(this.normal.clone(), this.distance);
  }
  
  flip()
  {
    this.normal.multiplyScalar(-1);
    this.distance *= -1;
    return this;
  }
};
