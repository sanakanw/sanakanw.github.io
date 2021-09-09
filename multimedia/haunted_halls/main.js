var display = document.getElementById("display");

var ctx = display.getContext("2d");
ctx.imageSmoothingEnabled = false;

var SCALE = 3;

var width = Math.floor(display.width / SCALE);
var height = Math.floor(display.height / SCALE);

var _display = document.createElement("canvas");
var _display_image = new Image();
_display.setAttribute("width", width);
_display.setAttribute("height", height);

var pixels = [];
for (var i = 0; i < width * height; i++) pixels[i] = 0;

var spritesloaded = 0;

var logo = loadimage('logo.png');
var logo_cyan = loadimage('logo_cyan.png');
var logo_magenta = loadimage('logo_magenta.png');

function render_pixels() {
	var image_data = _display.getContext("2d").getImageData(0, 0, width, height);
	var _pixels = image_data.data;
	
	for (var i = 0; i < width * height; i++) {
		_pixels[i * 4 + 0] = (pixels[i] >> 16) & 0xff;
		_pixels[i * 4 + 1] = (pixels[i] >> 8) & 0xff;
		_pixels[i * 4 + 2] = (pixels[i]) & 0xff;
		_pixels[i * 4 + 3] = 0xff;
	}
	
	_display.getContext("2d").putImageData(image_data, 0, 0);
	_display_image.src = _display.toDataURL();
	
	ctx.drawImage(_display, 0, 0, width * SCALE, height * SCALE);
}

var previous_time = new Date().getTime();
var seconds_per_tick = 1.0 / 60.0;
var unprocessed_time = 0.0;

var ticks = 0;

function tick() {}
function render() {}

var loop_function = setInterval(function() {
	var current_time = new Date().getTime();
	var elapsed_time = current_time - previous_time;
	previous_time = current_time;
	
	unprocessed_time += elapsed_time / 1000.0;
	
	while (unprocessed_time > seconds_per_tick) {
		unprocessed_time -= seconds_per_tick;
		
		if (ticks >= 240) {
			tick();
			render();
		}
		
		ticks++;
	}
	
	if (ticks < 240) {
		renderlogo();
		return;
	}
	
	render_pixels();
}, 10);

function renderlogo() {
	ctx.clearRect(0, 0, display.width, display.height);
	
	var yheight = 3.0;
	var zdepth = 30;
	var zpos = ticks / 60.0;
	
	for (var z = 0; z < zdepth / 2.0 + 2; z++) {
		var ypixel = yheight / (z * 2.0 - zpos) * (display.height / 2.0) + display.height / 2.0;
		
		if (z * 2.0 - zpos < 0) continue;
		
		ctx.fillStyle = "#ff00ff";
		ctx.fillRect(0, Math.floor(ypixel), display.width, 1);
		ctx.fillStyle = "#ffffff";
	}
	
	for (var x = -50; x < 50; x++) {
		var xpixel0 = (x * 2.0) / 1.0 * (display.height / 2.0) + display.width / 2.0;
		var xpixel1 = (x * 2.0) / zdepth * (display.height / 2.0) + display.width / 2.0;
		
		var ypixel0 = yheight / 1.0 * (display.height / 2.0) + display.height / 2.0;
		var ypixel1 = yheight / zdepth * (display.height / 2.0) + display.height / 2.0;
		

		ctx.strokeStyle = "#ff00ff";

		ctx.beginPath();
			ctx.moveTo(xpixel1, ypixel1);
			ctx.lineTo(xpixel0, ypixel0);
		ctx.stroke();

		ctx.strokeStyle = "#ffffff";
	}
	
	if (ticks < 180) {
		ctx.globalAlpha = ticks / 240.0;
		ctx.drawImage(logo, 272, 172, 256, 256);
	} else if (ticks < 240) {
		ctx.globalAlpha = 1.0;
		ctx.drawImage(logo, 272, 172, 256, 256);
		ctx.globalAlpha = 0.5;
		
		var xtick = (ticks - 240) / 60 * 10;
		
		ctx.drawImage(logo_cyan, 272 - xtick, 172 - 10, 256, 256);
		ctx.drawImage(logo_magenta, 272 + xtick, 172 + 10, 256, 256);
		ctx.globalAlpha = 1.0;
	}
}

function loadimage(imgsrc) {
	var image = new Image();
	
	image.onload = function() {
		spritesloaded++;
	};
	
	image.src = imgsrc;
	
	return image;
}