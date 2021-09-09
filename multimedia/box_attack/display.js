
function Display(canvas)
{
	this.canvas = canvas;
	this.SCALE = 2.0;
	this.width = canvas.width / this.SCALE;
	this.height = canvas.height / this.SCALE;
	this.pixels = new Array(this.width * this.height);
	this.ctx = canvas.getContext("2d");
	
	for (var i = 0; i < this.pixels.length; i++) this.pixels[i] = 0;
}

Display.prototype.render = function (render2D)
{
	render2D.render();
	this.pixels = render2D.pixels;
}