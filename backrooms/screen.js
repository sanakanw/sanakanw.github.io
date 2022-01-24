"use strict";

const EVENT_MOUSEMOVE = 0;
const EVENT_KEYDOWN   = 1;
const EVENT_KEYUP     = 2;

import { client_t } from "./client.js";
import { display_t } from "./display.js";

const screen_canvas = document.getElementById("screen");
const screen_ctx = screen_canvas.getContext("2d");

screen_canvas.width = document.body.clientHeight * 16 / 9;
screen_canvas.height = document.body.clientHeight;

screen_ctx.imageSmoothingEnabled = false;
screen_canvas.requestLockPointer = screen_canvas.requestPointerLock || screen_canvas.mozRequestPointerLock;

const screen_width = screen_canvas.width;
const screen_height = screen_canvas.height;

const event_queue = [];

function screen_mousemove(e)
{
  event_queue.push({
    type: EVENT_MOUSEMOVE,
    data: [ e.movementX, e.movementY ]
  });
}

function screen_keydown(e)
{
  event_queue.push({
    type: EVENT_KEYDOWN,
    data: e.keyCode
  });
}

function screen_keyup(e)
{
  event_queue.push({
    type: EVENT_KEYUP,
    data: e.keyCode
  });
}

document.addEventListener("pointerlockchange", function(e) {
  if (document.pointerLockElement == screen_canvas
  || document.mozPointerLockElement == screen_canvas) {
    document.addEventListener("mousemove", screen_mousemove);
    document.addEventListener("keydown", screen_keydown);
    document.addEventListener("keyup", screen_keyup);
  } else {
    document.removeEventListener("mousemove", screen_mousemove);
    document.removeEventListener("keydown", screen_keydown);
    document.removeEventListener("keyup", screen_keyup);
  }
});

let bgm_playing = false;

screen_canvas.addEventListener("click", function() {
  screen_canvas.requestPointerLock();
});

export function screen_poll(client)
{
  while (event_queue.length > 0) {
    const event = event_queue.shift();
    switch (event.type) {
    case EVENT_MOUSEMOVE:
      client.mouse_move(event.data[0], event.data[1]);
      break;
    case EVENT_KEYDOWN:
      client.key_event(event.data, 1);
      break;
    case EVENT_KEYUP:
      client.key_event(event.data, 0);
      break;
    }
  }
  
  event_queue.length = 0;
}

export function screen_swap(display)
{
  screen_ctx.drawImage(display.canvas, 0, 0, screen_width, screen_height);
}
