
function BasicEnemy(level, target, x, y, direction)
{
	Enemy.call(this, level, target, x, y, direction);
	this.lastShot = new Date().getTime();
	this.hp = 50;
	this.spawnTime = new Date().getTime();
}

BasicEnemy.prototype = Object.create(Enemy.prototype);

BasicEnemy.prototype.tick = function(render2D)
{
	if (this.hp <= 0)
	{
		for (var i = 0; i < Math.PI * 2.0; i += Math.PI / 180 * 10.0)
		{
			var particle = new Particle(this.level, this.x, this.y, 0.1, i + Math.random() * 0.5 - 0.5, 100);
		}
		render2D.enemies -= 1;
		
		if (int(Math.floor(Math.random() * 6)) == 1)
		{
			if (render2D.player.speed < 0.2)
				render2D.player.speed += 0.01;
		}
		
		if (int(Math.floor(Math.random() * 3)) == 1)
		{
			if (render2D.player.shootSpeed < 3)
				render2D.player.shootSpeed += 0.2;
		}
		
		this.remove();
	}
	
	if (new Date().getTime() - this.spawnTime < 1000)
		return;
	
	var dx = this.target.x - this.x;
	var dy = this.target.y - this.y;
	
	var dir = Math.atan2(dy, dx);
	
	var dist = Math.sqrt(dx * dx + dy * dy);
	
	if (dist < 10)
	{
		if (dist < 7 && new Date().getTime() > this.lastShot)
		{
			for (var i = -3; i < 3; i++)
			{
				var projectile = new EnemyProjectile(this.level, this.x, this.y, 0.1, dir + (i * 13) * Math.PI / 180, 1000);
			}
			this.lastShot = new Date().getTime() + 1000;
		}
		
		if (dist > 3)
		{
			var speed = 0.05;
			
			if (new Date().getTime() % 5000 > 2000)
			{
				var stepX = Math.cos(dir) * speed;
				var stepY = Math.sin(dir) * speed;
				
				this.move(stepX, stepY);
			}
			
			for (var i = 0; i < this.level.entities.length; i++)
			{
				var object = this.level.entities[i];
				
				if (object.isEnemy && object != this)
				{					
					var ex = object.x - this.x;
					var ey = object.y - this.y;
					
					var eDir = -Math.atan2(ey, ex);
					
					var eDist = Math.sqrt(ex * ex + ey * ey);
					
					if (eDist < 3)
					{
						var stepX = Math.cos(eDir) * speed;
						var stepY = Math.sin(eDir) * speed;
						
						this.move(stepX, stepY);
					}
				}
			}
		}
	}
}

BasicEnemy.prototype.move = function(xa, ya)
{
	if (!this.collision(this.x + xa, this.y + ya))
	{
		this.x += xa;
		this.y += ya;
	}
	else if (!this.collision(this.x, this.y + ya))
	{
		this.x += 0;
		this.y += ya;
	}
	else if (!this.collision(this.x + xa, this.y))
	{
		this.x += xa;
		this.y += 0;
	}
}

BasicEnemy.prototype.render = function(render3D)
{
	render2D.sprite(0xff0000, this.x, this.y, 1.0, -render2D.dir);
}

BasicEnemy.prototype.collision = function(xa, ya)
{
	var dx = 0.4;
	var dy = 0.4;
	
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