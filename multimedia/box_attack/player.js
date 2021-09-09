
function Player(level, display, x, y, direction)
{
	this.display = display;
	
	this.level = level;
	
	Entity.call(this, level, x, y, direction);
	this.Input = new InputHandler(this.display);
	this.lastShot = new Date().getTime();
	
	this.hp = 100;
	this.isPlayer = true;
	this.speed = 0.08;
	this.shootSpeed = 1;
	this.maxHealth = 100;
	
	this.spawnTime = new Date().getTime();
	
	this.invulnerable = true;
	this.lastInvulnerable = new Date().getTime();
}

Player.prototype = Object.create(Entity.prototype);

Player.prototype.tick = function()
{
	document.getElementById("health").innerHTML = "health: " + Math.round(this.hp) + "/100";
	
	if (new Date().getTime() % 1000 < 20 && this.hp < this.maxHealth)
	{
		this.hp += 1;
	}
	
	if (this.hp <= 0)
	{
		this.hp = 0;
		
		for (var i = 0; i < this.level.entities.length; i++)
		{
			this.level.entities[i].tick = function(){};
		}
		
		render2D.displayText("YOU DIED!", "#FF0000", render2D.width / 2 * render2D.display.SCALE - 5 * "YOU DIED!".length, render2D.height / 2 * render2D.display.SCALE, 3000);
		
		waitFor(restart, 3000);
		document.getElementById("hp").innerHTML = "hp: " + Math.round(this.hp);
	}
	
	if (this.invulnerable)
	{
		if (new Date().getTime() - this.lastInvulnerable > 300)
		{
			this.invulnerable = false;
		}
	}
	
	var Input = this.Input;
	
	if (this.Input.GetMouseButton(0) && new Date().getTime() > this.lastShot)
	{
		var dx = Input.mouseX - this.display.width / 2.0;
		var dy = Input.mouseY - this.display.height / 2.0;
		
		var dir = Math.atan2(dy, dx);
		
		var projectile = new PlayerProjectile(this.level, this.x, this.y, 0.25, dir + this.direction, 300);
		
		this.lastShot = new Date().getTime() + 300 / this.shootSpeed;
	}
	
	if (Input.GetKey("W"))
	{
		var stepX = Math.cos(this.direction - 90 * Math.PI / 180) * this.speed;
		var stepY = Math.sin(this.direction - 90 * Math.PI / 180) * this.speed;
		
		this.move(stepX, stepY);
	}
	
	if (Input.GetKey("A"))
	{
		var stepX = -Math.cos(this.direction) * this.speed;
		var stepY = -Math.sin(this.direction) * this.speed;
		
		this.move(stepX, stepY);
	}
	
	if (Input.GetKey("S"))
	{
		var stepX = -Math.cos(this.direction - 90 * Math.PI / 180) * this.speed;
		var stepY = -Math.sin(this.direction - 90 * Math.PI / 180) * this.speed;
		
		this.move(stepX, stepY);
	}
	
	if (Input.GetKey("D"))
	{
		var stepX = Math.cos(this.direction) * this.speed;
		var stepY = Math.sin(this.direction) * this.speed;
		
		this.move(stepX, stepY);
	}
	
	if (Input.GetKey("Q"))
		this.direction -= 0.05;
	if (Input.GetKey("E"))
		this.direction += 0.05;
}

Player.prototype.render = function(render2D)
{
	render2D.sprite(0, render2D.xCam, render2D.yCam, 1.0, -render2D.dir);
}

Player.prototype.move = function(xa, ya)
{
	if (!this.collision(this.x + xa, this.y + ya))
	{
		this.x += xa;
		this.y += ya;
	} else if (!this.collision(this.x + xa, this.y))
		this.x += xa;
	else if (!this.collision(this.x, this.y + ya))
		this.y += ya;
}

Player.prototype.collision = function(xa, ya)
{
	var dx = 0.35;
	var dy = 0.35;
	
	var yc = 0.0;
	var xc = 0.0;
	
	var x0 = int(xa + xc - dx);
	var x1 = int(xa + xc + dx);
	var y0 = int(ya + yc - dy);
	var y1 = int(ya + yc + dy);
	
	if (this.level.GetTile(x0, y0) == 0) return true;
	if (this.level.GetTile(x1, y0) == 0) return true;
	if (this.level.GetTile(x0, y1) == 0) return true;
	if (this.level.GetTile(x1, y1) == 0) return true;
}