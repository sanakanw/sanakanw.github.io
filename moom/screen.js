"use strict";

const EVENT_MOUSEMOVE = 0;
const EVENT_KEYDOWN   = 1;
const EVENT_KEYUP     = 2;
const EVENT_MOUSEDOWN = 3;
const EVENT_MOUSEUP   = 4;

import { client_t } from "./client.js";
import { display_t } from "./display.js";
import { sound_t } from "./sound.js";

const snd_bgm = new sound_t("bgm.mp3");
const snd_bgm2 = new sound_t("bgm2.mp3");
snd_bgm.loop();
snd_bgm.set_volume(0.05);
snd_bgm2.loop();
let bgm_playing = false;

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

function screen_mouse_down(e)
{
  event_queue.push({
    type: EVENT_MOUSEDOWN,
    data: e.button
  });
}

function screen_mouse_up(e)
{
  event_queue.push({
    type: EVENT_MOUSEUP,
    data: e.button
  });
}

document.addEventListener("pointerlockchange", function(e) {
  if (!bgm_playing) {
    snd_bgm.play();
    snd_bgm2.play();
    bgm_playing = true;
  }
  
  if (document.pointerLockElement == screen_canvas
  || document.mozPointerLockElement == screen_canvas) {
    document.addEventListener("mousemove", screen_mousemove);
    document.addEventListener("keydown", screen_keydown);
    document.addEventListener("keyup", screen_keyup);
    document.addEventListener("mousedown", screen_mouse_down);
    document.addEventListener("mouseup", screen_mouse_up);
  } else {
    document.removeEventListener("mousemove", screen_mousemove);
    document.removeEventListener("keydown", screen_keydown);
    document.removeEventListener("keyup", screen_keyup);
    document.removeEventListener("mousedown", screen_mouse_down);
    document.removeEventListener("mouseup", screen_mouse_up);
  }
});

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
    case EVENT_MOUSEDOWN:
      client.mouse_event(event.data, 1);
      break;
    case EVENT_MOUSEUP:
      client.mouse_event(event.data, 0);
      break;
    }
  }
  
  event_queue.length = 0;
}

export function screen_swap(display)
{
  screen_ctx.drawImage(display.canvas, 0, 0, screen_width, screen_height);
}
