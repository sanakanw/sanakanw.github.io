var mwidth = 50;
var mheight = 50;

function Render2D(display)
{
	this.width = display.width;
	this.height = display.height;
	this.display = display;
	this.pixels = new Array(this.width * this.height);
	
	this.xCam = 3;
	this.yCam = 3;
	
	this.dir = 0.05;
	
	this.level = new Level(mwidth, mheight);
	this.player = new Player(this.level, this.display, 3, 3, 0);
	
	while (this.player.collision(this.player.x, this.player.y))
	{
		this.level = new Level(mwidth, mheight);
	}
	
	this.wave = 0;
	this.enemies = 0;
	this.enemiesSpawn = 3;
	
	this.textRender = new Array();
	
	for (var i = 0; i < this.pixels.length; i++) this.pixels[i] = 0;
}

Render2D.prototype.tick = function()
{
	document.getElementById("wave").innerHTML = "wave: " + Math.round(this.wave);
	
	if (this.enemies <= 0)
	{
		for (var i = 0; i < this.enemiesSpawn; i++)
		{
			var mapX = 2 + Math.random() * (mwidth - 2);
			var mapY = 2 + Math.random() * (mheight - 2);
			
			while (this.player.collision(mapX, mapY))
			{
				mapX = Math.random() * mwidth;
				mapY = Math.random() * mheight;
			}
			
			var enemy = new BasicEnemy(this.level, this.player, mapX, mapY, 0.0);
			this.enemies++;
		}
		
		this.wave++;
		this.enemiesSpawn++;
	}
	
	this.xCam = this.player.x;
	this.yCam = this.player.y;
	
	this.dir = this.player.direction;
	
	for (var i = 0; i < this.level.entities.length; i++)
		this.level.entities[i].tick(this);
}

Render2D.prototype.render = function()
{
	this.xCam = this.player.x;
	this.yCam = this.player.y;
	
	this.dir = this.player.direction;
	
	var pixels = this.pixels;
	
	this.loadTilemap();
	
	for (var i = 0; i < this.level.entities.length; i++)
		this.level.entities[i].render(this);
	
	this.pixels = pixels;
}

Render2D.prototype.displayText = function(text, color, x, y, life)
{
	this.addText(text, color, x, y);
	
	var done = false;
	
	var self = this;
	
	var loop = setInterval(function ()
	{
		done = true;
		
		if (done)
		{
			self.removeText(text, color, x, y);
			clearInterval(loop);
		}
	}, life);
}

Render2D.prototype.sprite = function(color, x, y, SCALE, angle)
{
	var cosine = Math.cos(this.dir);
	var sine = Math.sin(this.dir);
	
	var cos = Math.cos(this.dir + angle);
	var sin = Math.sin(this.dir + angle);
	
	var xc = x - this.xCam;
	var yc = y - this.yCam;
	
	var xx = xc * cosine + yc * sine;
	var yy = yc * cosine - xc * sine;
	
	var xPixel = xx * 32.0 / this.display.SCALE + width / 2.0;
	var yPixel = yy * 32.0 / this.display.SCALE + height / 2.0;
	
	var xPixel0 = xPixel - 16.0 / this.display.SCALE * 2.0 * SCALE;
	var xPixel1 = xPixel + 16.0 / this.display.SCALE * 2.0 * SCALE;
	var yPixel0 = yPixel - 16.0 / this.display.SCALE * 2.0 * SCALE;
	var yPixel1 = yPixel + 16.0 / this.display.SCALE * 2.0 * SCALE;
	
	var xp0 = int(xPixel0);
	var xp1 = int(xPixel1);
	var yp0 = int(yPixel0);
	var yp1 = int(yPixel1);
	
	for (var xp = xp0; xp < xp1; xp++)
	{
		var nx = (xp - xPixel) / 2.0;
		
		for (var yp = yp0; yp < yp1; yp++)
		{	
			var ny = (yp - yPixel) / 2.0;
			
			var nxPixel = xPixel + nx * cos + ny * sin;
			var nyPixel = yPixel + ny * cos - nx * sin;
			
			var nxp = int(nxPixel);
			var nyp = int(nyPixel);
			
			if (nxp < 0)
				continue;
			if (nxp >= this.width)
				continue;
			if (nyp < 0)
				continue;
			if (nyp >= this.height)
				continue;
			
			this.pixels[nxp + nyp * this.width] = color;
		}
	}
}

Render2D.prototype.loadTilemap = function()
{
	this.dir += 0.005;
	
	var cosine = Math.cos(this.dir);
	var sine = Math.sin(this.dir);
	
	for (var y = 0; y < this.height; y++)
	{
		for (var x = 0; x < this.width; x++)
		{
			var xc = (x - width / 2.0);
			var yc = (y - height / 2.0);
			
			var xx = xc * cosine - yc * sine;
			var yy = yc * cosine + xc * sine;
			
			var xTile = (xx + this.xCam * 32.0 / this.display.SCALE) / (32.0 / this.display.SCALE);
			var yTile = (yy + this.yCam * 32.0 / this.display.SCALE) / (32.0 / this.display.SCALE);
			
			var xt = int(xTile);
			var yt = int(yTile);
			
			this.pixels[x + y * width] = this.level.GetTile(xt, yt);
		}
	}
}

Render2D.prototype.addText = function(text, color, x, y)
{
	this.textRender[this.textRender.length] = {text: text, x: x, y: y, color: color};
}

Render2D.prototype.removeText = function(text, color, x, y)
{
	for (var i = 0; i < this.textRender.length; i++)
	{
		var thistext = this.textRender[i];
		
		if (thistext.text == text && thistext.x == x && thistext.y == y && thistext.color == color)
		{
			this.textRender.splice(i, 1);
		}
	}
}