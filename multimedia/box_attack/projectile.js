
function Projectile(level, x, y, speed, dir, life)
{
	this.level = level;
	
	this.level.entities[this.level.entities.length] = this;
	
	this.x = x;
	this.y = y;
	this.speed = speed;
	this.dir = dir;
	this.life = life;
	
	this.startTime = new Date().getTime();
}

Projectile.prototype.remove = function()
{
	for (var i = 0; i < this.level.entities.length; i++)
		if (this.level.entities[i] == this)
			this.level.entities.splice(i, 1);
}

Projectile.prototype.tick = function()
{
	if (time.getTime() - this.startTime > this.life)
	{
		this.remove();
	}
	
	var stepX = Math.cos(this.dir) * this.speed;
	var stepY = Math.sin(this.dir) * this.speed;
	
	this.x += stepX;
	this.y += stepY;
}

Projectile.prototype.render = function(render2D)
{
	render2D.sprite(0, this.x, this.y, 1.0, -this.dir);
}