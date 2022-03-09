"use strict";

import { screen } from "./screen.js";
import { usercmd_t } from "./common/usercmd.js";

export class input_t {
  static KEY_FORWARD  = "W".charCodeAt(0);
  static KEY_LEFT     = "A".charCodeAt(0);
  static KEY_BACK     = "S".charCodeAt(0);
  static KEY_RIGHT    = "D".charCodeAt(0);
  static KEY_JUMP     = " ".charCodeAt(0);
  
  constructor()
  {
    this.in_forward = 0;
    this.in_left    = 0;
    this.in_back    = 0;
    this.in_right   = 0;
    this.in_jump    = 0;
    
    this.rot_yaw    = 0;
    this.rot_pitch  = 0;
    
    this.setup();
  }
  
  setup()
  {
    const fn_keyup = (e) => this.key_event(e.keyCode, 0);
    const fn_keydown = (e) => this.key_event(e.keyCode, 1);
    const fn_mousemove = (e) => this.mouse_move(e.movementX, e.movementY);
    
    document.addEventListener("pointerlockchange", (e) => {
      if (document.pointerLockElement == screen
      || document.mozPointerLockElement == screen) {
        document.addEventListener("mousemove", fn_mousemove);
        document.addEventListener("keydown", fn_keydown);
        document.addEventListener("keyup", fn_keyup);
      } else {
        document.removeEventListener("mousemove", fn_mousemove);
        document.removeEventListener("keydown", fn_keydown);
        document.removeEventListener("keyup", fn_keyup);
      }
    });
  }
  
  key_event(keycode, action)
  {
    if (action == 1) {
      switch (keycode) {
      case input_t.KEY_FORWARD:
        this.in_forward_down();
        break;
      case input_t.KEY_LEFT:
        this.in_left_down();
        break;
      case input_t.KEY_BACK:
        this.in_back_down();
        break;
      case input_t.KEY_RIGHT:
        this.in_right_down();
        break;
      case input_t.KEY_JUMP:
        this.in_jump_down();
        break;
      }
    } else if (action == 0) {
      switch (keycode) {
      case input_t.KEY_FORWARD:
        this.in_forward_up();
        break;
      case input_t.KEY_LEFT:
        this.in_left_up();
        break;
      case input_t.KEY_BACK:
        this.in_back_up();
        break;
      case input_t.KEY_RIGHT:
        this.in_right_up();
        break;
      case input_t.KEY_JUMP:
        this.in_jump_up();
        break;
      }
    }
  }
  
  mouse_move(dx, dy)
  {
    this.rot_yaw += dx;
    this.rot_pitch += dy;
  }
  
  base_move()
  {
    const cmd_right = this.in_right - this.in_left;
    const cmd_forward = this.in_forward - this.in_back;
    const cmd_jump = this.in_jump;
    const cmd_yaw = this.rot_yaw;
    const cmd_pitch = this.rot_pitch;
    
    return new usercmd_t(cmd_right, cmd_forward, cmd_jump, cmd_yaw, cmd_pitch);
  }
  
  in_forward_down() { this.in_forward = 1;  }
  in_left_down()    { this.in_left = 1;     }
  in_back_down()    { this.in_back = 1;     }
  in_right_down()   { this.in_right = 1;    }
  in_jump_down()    { this.in_jump = 1;     }
  
  in_forward_up()   { this.in_forward = 0;  }
  in_left_up()      { this.in_left = 0;     }
  in_back_up()      { this.in_back = 0;     }
  in_right_up()     { this.in_right = 0;    }
  in_jump_up()    { this.in_jump = 0;     }
}
