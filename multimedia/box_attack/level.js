
function Level(width, height)
{
	this.mapWIDTH = width;
	this.mapHEIGHT = height;
	
	this.tiles = new Array(this.mapWIDTH * this.mapHEIGHT);
	
	this.entities = new Array();
	
	for (var i = 0; i < this.tiles.length; i++) this.tiles[i] = Math.floor(Math.random() * 60) == 1 ? 0 : 0xffffff;
}

Level.prototype.SetTile = function(x, y)
{
	if (x < 0 || y < 0 || x >= this.mapWIDTH || y >= this.mapHEIGHT)
		return;
	
	this.tiles[x + y * this.mapWIDTH] = 1;
}

Level.prototype.GetTile = function(x, y)
{
	if (x < 0 || y < 0 || x >= this.mapWIDTH || y >= this.mapHEIGHT)
		return 0;
	
	return this.tiles[x + y * this.mapWIDTH];
}