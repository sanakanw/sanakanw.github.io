var canvas = document.getElementById("display");
var display = new Display(canvas);

var width = display.width;
var height = display.height;

var ctx = display.ctx;

var render2D = new Render2D(display);

var spritesloaded = 0;

var logo = loadimage('logo.png');
var logo_cyan = loadimage('logo_cyan.png');
var logo_magenta = loadimage('logo_magenta.png');

function restart()
{
	render2D = new Render2D(display);
}

function start()
{
	ctx.imageSmoothingEnabled = false;
}

function tick()
{
	render2D.tick();
}

function render()
{
	var c = document.createElement("CANVAS");
	
	c.width = display.width;
	c.height = display.height;
	
	display.render(render2D);
	
	var pixelData = ctx.getImageData(0, 0, c.width, c.height);
	
	for (var i = 0; i < pixelData.data.length; i += 4)
	{
		var color = display.pixels[i / 4];
		
		pixelData.data[i + 0] = (color >> 16) & 0xff;
		pixelData.data[i + 1] = (color >> 8) & 0xff;
		pixelData.data[i + 2] = (color) & 0xff;
		pixelData.data[i + 3] = 255;
	}
	
	c.getContext("2d").putImageData(pixelData, 0, 0);
	
	ctx.drawImage(c, 0, 0, width * display.SCALE, height * display.SCALE);
	
	ctx.font = "bold 20px Consolas";
	ctx.textAlign = "center";
	
	for (var i = 0; i < render2D.textRender.length; i++)
	{
		ctx.fillStyle = render2D.textRender[i].color;
		ctx.fillText(render2D.textRender[i].text, render2D.textRender[i].x, render2D.textRender[i].y);
		ctx.strokeText(render2D.textRender[i].text, render2D.textRender[i].x, render2D.textRender[i].y);
	}
}

function waitFor(f, time)
{
	var func = f;
	
	var loop = setInterval(function ()
	{
		func();
		clearInterval(loop);
	}, time);
}

function int(num)
{
	return Math.round(Math.floor(num));
}

(function ()
{
	start();
})();

var pticks = 0;

(function ()
{
	var previousTime = new Date().getTime();
	var unprocessedSeconds = 0.0;
	var secondsPerTick = 1.0 / 60.0;
	
	setInterval(function ()
	{
		var currentTime = new Date().getTime();
		var elapsedTime = currentTime - previousTime;
		previousTime = currentTime;
		
		unprocessedSeconds += elapsedTime / 1000.0;
		
		while (unprocessedSeconds > secondsPerTick)
		{
			unprocessedSeconds -= secondsPerTick;
			
			if (pticks >= 240)
				tick();
			
			pticks++;
		}
		
		if (pticks < 240) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			renderlogo();
			return;
		} else
			render();
	}, 0);
})();

function renderlogo() {
	var yheight = 3.0;
	var zdepth = 30;
	var zpos = pticks / 60.0;
	
	for (var z = 0; z < zdepth / 2.0 + 2; z++) {
		var ypixel = yheight / (z * 2.0 - zpos) * (canvas.height / 2.0) + canvas.height / 2.0;
		
		if (z * 2.0 - zpos < 0) continue;
		
		ctx.fillStyle = "#ff00ff";
		ctx.fillRect(0, Math.floor(ypixel), canvas.width, 1);
		ctx.fillStyle = "#ffffff";
	}
	
	for (var x = -50; x < 50; x++) {
		var xpixel0 = (x * 2.0) / 1.0 * (canvas.height / 2.0) + canvas.width / 2.0;
		var xpixel1 = (x * 2.0) / zdepth * (canvas.height / 2.0) + canvas.width / 2.0;
		
		var ypixel0 = yheight / 1.0 * (canvas.height / 2.0) + canvas.height / 2.0;
		var ypixel1 = yheight / zdepth * (canvas.height / 2.0) + canvas.height / 2.0;
		

		ctx.strokeStyle = "#ff00ff"; 

		ctx.beginPath();
			ctx.moveTo(xpixel1, ypixel1);
			ctx.lineTo(xpixel0, ypixel0);
		ctx.stroke();

		ctx.strokeStyle = "#ffffff";
	}
	
	if (pticks < 180) {
		ctx.globalAlpha = pticks / 240.0;
		ctx.drawImage(logo, 272, 172, 256, 256);
	} else if (pticks < 240) {
		ctx.globalAlpha = 1.0;
		ctx.drawImage(logo, 272, 172, 256, 256);
		ctx.globalAlpha = 0.5;
		
		var xtick = (pticks - 240) / 60 * 10;
		
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