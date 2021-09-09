function EnemyProjectile(level, x, y, speed, dir, life)
{
	Projectile.call(this, level, x, y, speed, dir, life);
}

EnemyProjectile.prototype = Object.create(Projectile.prototype);

EnemyProjectile.prototype.tick = function(render2D)
{
	for (var i = 0; i < this.level.entities.length; i++)
	{
		var object = this.level.entities[i];
		
		if (object.isPlayer)
		{
			var dx = object.x - this.x;
			var dy = object.y - this.y;
			
			var dist = Math.sqrt(dx * dx + dy * dy);
			
			if (dist < 1 && !object.invulnerable)
			{
				object.hp -= 3 + int((render2D.enemiesSpawn - 1) / 3);
				
				object.invulnerable = true;
				object.lastInvulnerable = new Date().getTime();
				
				render2D.displayText("-" + int(3 + ((render2D.enemiesSpawn - 1) / 3)).toString(), "#FF0000", render2D.width / 2.0 * render2D.display.SCALE - 8, render2D.height / 2.0 * render2D.display.SCALE - 32 / render2D.display.SCALE - 3, 300);
				
				this.remove();
			}
		}
	}
	
	if (new Date().getTime() - this.startTime > this.life)
	{
		this.remove();
	}
	
	var stepX = Math.cos(this.dir) * this.speed;
	var stepY = Math.sin(this.dir) * this.speed;
	
	if (this.collision(this.x, this.y))
	{
		for (var i = -3; i < 3; i++)
		{
			var dir = Math.atan2(-stepY, -stepX) + (i * 70.0) * Math.PI / 180;
			
			var projectile = new Particle(this.level, this.x, this.y, 0.1, dir + Math.random() * 0.5 - 0.25, Math.random() * 200);
		}
		this.remove();
	}
	
	this.x += stepX;
	this.y += stepY;
}

EnemyProjectile.prototype.render = function(render2D)
{
	render2D.sprite(0xff0000, this.x, this.y, 0.25, -this.dir);
}

EnemyProjectile.prototype.collision = function(xa, ya)
{
	var dx = 0.1;
	var dy = 0.1;
	
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