"use strict";

export const screen = document.getElementById("screen");
screen.requestLockPointer = screen.requestPointerLock || screen.mozRequestPointerLock;

screen.addEventListener("click", function() {
  screen.requestPointerLock();
});
