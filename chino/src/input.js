"use strict";

const keyDict = {};

export function inputInit()
{
  document.addEventListener("keydown", (e) => {
    keyDict[e.keyCode] = true;
  });
  
  document.addEventListener("keyup", (e) => {
    keyDict[e.keyCode] = false;
  });
}

export function inputGetKey(key)
{
  return keyDict[key.charCodeAt(0)];
}
