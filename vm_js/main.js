
let obj_file;

let ctx;
let ctx_data;

let display;

function load_obj(path, on_asset_loaded)
{
  var xhttp = new XMLHttpRequest();
  xhttp.onload = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      xhttp.response.arrayBuffer().then(buffer => {
        obj_file = buffer;
        on_asset_loaded();
      });
    }
  };
  xhttp.open("GET", path, true);
  xhttp.responseType = "blob";
  xhttp.send();
}

function vid_init()
{
  display = get_id("display").getContext("2d");
  display.imageSmoothingEnabled = false;
  let c = document.createElement("CANVAS");
  c.width = 128;
  c.height = 96;
  ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  
  ctx_data = ctx.getImageData(0, 0, 128, 96);
  
  for (let i = 0; i < 128 * 96; i++) {
    ctx_data.data[i * 4 + 0] = 0;
    ctx_data.data[i * 4 + 1] = 0;
    ctx_data.data[i * 4 + 2] = 0;
    ctx_data.data[i * 4 + 3] = 255;
  }
}

function vid_update(vm, vga_addr)
{
  ctx.clearRect(0, 0, 128, 96);
  
  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 4; x++) {
      let color = vm.mem[vga_addr / sizeof_op_t + x + y * 4];
      
      for (let i = 0; i < 32; i++) {
        let pos = (x * 32 + y * 128 + i) * 4;
        
        if (color & (1 << i)) {
          ctx_data.data[pos + 0] = 255;
          ctx_data.data[pos + 1] = 255;
          ctx_data.data[pos + 2] = 255;
          ctx_data.data[pos + 3] = 255;
        } else {
          ctx_data.data[pos + 0] = 0;
          ctx_data.data[pos + 1] = 0;
          ctx_data.data[pos + 2] = 0;
          ctx_data.data[pos + 3] = 255;
        }
      }
    }
  }
  
  ctx.putImageData(ctx_data, 0, 0);
  display.drawImage(ctx.canvas, 0, 0, display.canvas.width, display.canvas.height);
}

function main()
{
  let ctx;
  let vm;
  let bin;
  let vga_addr;
  
  let left = 0;
  let right = 0;
  let up = 0;
  let down = 0;
  
  document.addEventListener("keydown", function(e) {
    switch (e.keyCode) {
    case 38:
      up = 1;
      break;
    case 40:
      down= 1;
      break;
    case 87:
      left = 1;
      break;
    case 83:
      right = 1;
      break;
    }
  });
  
  document.addEventListener("keyup", function(e) {
    switch (e.keyCode) {
    case 38:
      up = 0;
      break;
    case 40:
      down = 0;
      break;
    case 87:
      left = 0;
      break;
    case 83:
      right = 0;
      break;
    }
  });
  
  bin = new Int32Array(obj_file);
  
  vid_init();
  
  vm = vm_create();
  vm_load_bin(vm, bin);
  
  vga_addr = vm_find_label(vm, "vga");
  
  let count = 0;
  
  vm_call(vm, "init");
	
  setInterval(function() {
    vm_call(vm, "draw");
    vm_call(vm, "update", [ left, right, up, down ]);
    vid_update(vm, vga_addr);
  }, 20);
}

function get_id(id)
{
  return document.getElementById("display");
}

function load()
{
  const asset_total = 1;
  
  let asset_count = 0;
  let on_asset_loaded = function() {
    if (++asset_count == asset_total)
      main();
  };
  
  load_obj("a.10o", on_asset_loaded);
}

(function() {
  load();
})();
