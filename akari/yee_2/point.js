import { vec2_t } from "../lib/math.js";
import { config } from "../lib/config.js";

export class point_t {
  constructor(p, q)
  {
    this.p = p;
    this.q = q;
    this.v = new vec2_t();
  }
  
  apply_field(field)
  {
    const p = this.p.floor();
    const cell = field.get_cell(p.x, p.y);
    this.v = this.v.add(cell.E.mulf(100 * this.q));
  }
  
  bound(field)
  {
    const next_pos = this.p.add(this.v.mulf(config.TIMESTEP));
    const q = this.p.floor();
    const p = next_pos.floor();
    
    const cell_x = field.get_cell(q.x, p.y);
    const cell_y = field.get_cell(p.x, q.y);
    const cell_xy = field.get_cell(p.x, p.y);
    
    if (cell_xy.solid) {
      this.v.x = 0;
      this.v.y = 0;
    } else if (cell_x.solid) {
      this.v.x = 0;
    } else if (cell_y.solid) {
      this.v.y = 0;
    }
  }
  
  drag()
  {
    this.v = this.v.sub(this.v.mulf(this.v.length() * 0.005));
  }
  
  integrate()
  {
    this.p = this.p.add(this.v.mulf(config.TIMESTEP));
  }
  
  draw(display)
  {
    const p = this.p.floor();
    if (this.q < 0)
      display.put_pixel_rgb([255, 255, 0], p.x, p.y);
    else
      display.put_pixel_rgb([255, 0, 255], p.x, p.y);
  }
};

