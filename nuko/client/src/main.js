"use strict";

import { client_t } from "./client.js";
import { cgame_t } from "./cgame/cgame.js";

function main()
{
  const client = new client_t();
  
  setInterval(function() {
    client.update();
  }, cgame_t.TICKRATE);
}

main();
