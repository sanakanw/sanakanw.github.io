"use strict";

export function loadFile(path, onLoaded)
{
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        onLoaded(xhr.responseText);
      } else {
        throw "loadFile(): could not load file";
      }
    }
  };
  
  xhr.open("GET", path);
  xhr.send();
}

export function loadJSON(path, onLoaded)
{
  loadFile(path, (file) => {
    onLoaded(JSON.parse(file));
  });
}

export function loadImage(path, onLoaded)
{
  const image = new Image();
  image.onload = function() {
    onLoaded(image);
  };
  
  image.src = path;
}
