
var wall;
load_texture("wall.png", function(texture) { wall = texture; });

function load_texture(path, callback) {
	var img = new Image();
	img.src = path;
	
	img.onload = function() {
		var width = img.width;
		var height = img.height;
		
		var c = document.createElement("CANVAS");
		c.setAttribute("width", width);
		c.setAttribute("height", height);
		
		var ctx = c.getContext("2d");
		
		ctx.drawImage(img, 0, 0, width, height);
		
		var image_data = ctx.getImageData(0, 0, width, height);
		var data = image_data.data;
		
		var pixels = [];
		
		for (var i = 0; i < width * height; i++) {
			var r = data[i * 4 + 0];
			var g = data[i * 4 + 1];
			var b = data[i * 4 + 2];
			
			pixels[i] = r << 16 | g << 8 | b;
		}
		
		callback({ width: width, height: height, pixels: pixels });
	}
}