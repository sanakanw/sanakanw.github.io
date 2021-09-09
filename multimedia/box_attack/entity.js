
function Entity(level, x, y, direction)
{
	this.level = level;
	
	this.level.entities[this.level.entities.length] = this;
	
	this.x = x;
	this.y = y;
	
	this.time = new Date();
	this.direction = direction;
}

Entity.prototype.remove = function()
{
	for (var i = 0; i < this.level.entities.length; i++)
		if (this.level.entities[i] == this)
			this.level.entities.splice(i, 1);
}

Entity.prototype.tick = function()
{
	
}

Entity.prototype.render = function(render3D)
{
	
}