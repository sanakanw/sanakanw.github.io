"use strict"

export class sound_t {
  constructor(src)
  {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
  }
  
  loop()
  {
    this.sound.loop = true;
  }
  
  set_volume(v)
  {
    this.sound.volume = v;
  }
  
  play()
  {
    this.sound.play();
  }
  
  stop()
  {
    this.sound.pause();
  }
};
