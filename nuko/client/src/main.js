"use strict";

import { client_t } from "./client.js";
import { cgame_t } from "./cgame/cgame.js";

function main()
{
  const client = new client_t();
  
  const main_loop = () => {
    client.update();
    window.requestAnimationFrame(main_loop);
  };
  
  window.requestAnimationFrame(main_loop);
}

main();
