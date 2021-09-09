
function Particle(level, x, y, speed, dir, life)
{
	Projectile.call(this, level, x, y, speed, dir, life);
}

Particle.prototype = Object.create(Projectile.prototype);

Particle.prototype.render = function(render3D)
{
	render3D.sprite(0, this.x, this.y, 0.1, -this.dir);
}

Particle.prototype.tick = function()
{
	if (new Date().getTime() - this.startTime > this.life)
	{
		this.remove();
	}
	
	var stepX = Math.cos(this.dir) * this.speed;
	var stepY = Math.sin(this.dir) * this.speed;
	
	if (this.collision(this.x + stepX, this.y + stepY))
	{
		this.remove();
	}
	
	this.x += stepX;
	this.y += stepY;
}

Particle.prototype.collision = function(xa, ya)
{
	var dx = 0.001;
	var dy = 0.001;
	
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