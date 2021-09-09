
function Enemy(level, target, x, y, direction)
{
	Entity.call(this, level, x, y, direction);
	this.target = target;
	this.isEnemy = true;
	this.hp = 0;
}

Enemy.prototype = Object.create(Entity.prototype);

Enemy.prototype.tick = function()
{
	var dx = this.target.x - this.x;
	var dy = this.target.y - this.y;
	
	var dir = Math.atan2(dy, dx);
	
	this.x += Math.cos(dir) * 0.05;
	this.y += Math.sin(dir) * 0.05;
}

Enemy.prototype.render = function(render2D)
{
	render2D.sprite(0xff0000, this.x, this.y, 1.0, -render2D.dir);
}
