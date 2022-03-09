"use strict";

const root_dir = window.location;

export function asset_load_file(path, on_loaded)
{
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        on_loaded(xhr.responseText);
      } else {
        throw "loadFile(): could not load file";
      }
    }
  };
  
  xhr.open("GET", root_dir + path);
  xhr.send();
}

export function asset_load_json(path, on_loaded)
{
  asset_load_file(path, (file) => {
    on_loaded(JSON.parse(file));
  });
}

export function asset_load_image(path, on_loaded)
{
  const image = new Image();
  image.onload = function() {
    on_loaded(image);
  };
  
  image.src = root_dir + path;
}
