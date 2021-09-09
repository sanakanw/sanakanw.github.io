
function InputHandler(display)
{
	this.mouseLeft = false;
	this.mouseMiddle = false;
	this.mouseRight = false;
	
	this.mouseX = 0.0;
	this.mouseY = 0.0;
	
	this.display = display;
	
	this.keyboard = new Array(500);
	
	for (var i = 0; i < 500; i++)
		this.keyboard[i] = false;
	
	var self = this;
	
	document.addEventListener('keydown', function(e)
	{
		self.keyboard[e.keyCode] = true;
	}, false);
	
	document.addEventListener('keyup', function(e)
	{
		self.keyboard[e.keyCode] = false;
	}, false);
	
	this.display.canvas.addEventListener('mousedown', function(e)
	{
		if (e.button == 0) self.mouseLeft = true;
		if (e.button == 1) self.mouseMiddle = true;
		if (e.button == 2) self.mouseRight = true;
	}, false);
	
	this.display.canvas.addEventListener('mouseup', function(e)
	{
		if (e.button == 0) self.mouseLeft = false;
		if (e.button == 1) self.mouseMiddle = false;
		if (e.button == 2) self.mouseRight = false;
	}, false);
	
	this.display.canvas.addEventListener('mousemove', function (e)
	{
		self.mouseX = int((e.clientX - display.canvas.getBoundingClientRect().left) / self.display.SCALE);
		self.mouseY = int((e.clientY - display.canvas.getBoundingClientRect().top) / self.display.SCALE);
	}, false);
}

InputHandler.prototype.GetMouseButton = function(button)
{
	if (button == 0) return this.mouseLeft;
	if (button == 1) return this.mouseMiddle;
	if (button == 2) return this.mouseRight;
}

InputHandler.prototype.GetKey = function(key)
{
	var keyCode = key.charCodeAt(0);
	
	return this.keyboard[keyCode];
}