var map = [
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 0, 1, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 1, 0, 1, 0, 1, 1, 0, 1,
	1, 0, 1, 0, 1, 0, 0, 1, 0, 1,
	1, 0, 1, 1, 1, 0, 0, 1, 0, 1,
	1, 0, 0, 0, 1, 1, 1, 1, 0, 1,
	1, 0, 1, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 1, 1, 1, 1, 0, 1, 1, 1,
	1, 0, 0, 0, 0, 1, 0, 0, 0, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1
];

var x_pos = 1.5;
var y_pos = 1.5;
var z_pos = 0.3;

var zbuffer = [];
for (var i = 0; i < width; i++) zbuffer[i] = 0;

var last_mouse_x = 0;
var last_mouse_y = 0;

var last_pos_x = 0;
var last_pos_y = 0;

var dir = 1.0;

function tick() {
	var speed = 0.05;
	
	if (mouse_left) {
		var enemy_dir = Math.atan2(5.0 - y_pos, 5.0 - x_pos);
		var enemy_dist = Math.sqrt((5.0 - x_pos) * (5.0 - x_pos) + (5.0 - y_pos) * (5.0 - y_pos));
		
		var dist = Math.tan(dir - enemy_dir) * enemy_dist;
		
		console.log("angle: " + ((dir - enemy_dir) * (180.0 / Math.PI) % 360) + ", " + "dist: " + enemy_dist + ", " + "shoot dist: " + dist);
	}
	
	if (mouse_x != last_mouse_x) {
		var movement = mouse_x - last_mouse_x;
		dir += movement / 500.0;
		
		last_mouse_x = mouse_x;
	}
	
	if (forward) {
		var x_step = Math.cos(dir) * speed;
		var y_step = Math.sin(dir) * speed;
		
		if (wall_collide(x_pos + x_step, y_pos + y_step, 0.2, 0.2)) return;
		
		x_pos += x_step;
		y_pos += y_step;
	} else if (back) {
		var x_step = Math.cos(dir) * speed;
		var y_step = Math.sin(dir) * speed;
		
		if (wall_collide(x_pos + x_step, y_pos + y_step, 0.2, 0.2)) return;
		
		x_pos -= x_step;
		y_pos -= y_step;
	}
	
	if (left) {
		var left_dir = dir - 90 * Math.PI / 180.0;
		
		var x_step = Math.cos(left_dir) * speed;
		var y_step = Math.sin(left_dir) * speed;
		
		if (wall_collide(x_pos + x_step, y_pos + y_step, 0.2, 0.2)) return;
		
		x_pos += x_step;
		y_pos += y_step;
	} else if (right) {
		var right_dir = dir + 90 * Math.PI / 180.0;
		
		var x_step = Math.cos(right_dir) * speed;
		var y_step = Math.sin(right_dir) * speed;
		
		if (wall_collide(x_pos + x_step, y_pos + y_step, 0.2, 0.2)) return;
		
		x_pos += x_step;
		y_pos += y_step;
	}
	
	if (last_pos_x != x_pos || last_pos_y != y_pos)
		z_pos = 0.3 + Math.cos(ticks / 4.0) / 20.0;
	else
		z_pos = 0.3;
	
	last_pos_x = x_pos;
	last_pos_y = y_pos;
}

function render() {
	raycast();
}

function wall_collide(x, y, dx, dy) {
	var x0 = Math.floor(x - dx);
	var x1 = Math.floor(x + dx);
	var y0 = Math.floor(y - dy);
	var y1 = Math.floor(y + dy);
	
	if (map[y0 * 10 + x0] > 0) return true;
	if (map[y0 * 10 + x1] > 0) return true;
	if (map[y1 * 10 + x0] > 0) return true;
	if (map[y1 * 10 + x1] > 0) return true;
	
	return false;
}

function render_sprite(sprite, _x, _y, _z) {
	var xpos = _x - y_pos;
	var ypos = _y - x_pos;
	var zpos = _z + z_pos - 0.25;
	
	var cos = Math.cos(dir);
	var sin = Math.sin(dir);
	
	var xxpos = xpos * cos - ypos * sin;
	var yypos = xpos * sin + ypos * cos;
	
	if (yypos < 0.1) return;
	
	var xpixel = xxpos / yypos * height + width / 2.0;
	var ypixel = zpos / yypos * height + height / 2.0;
	
	var xpixel0 = xpixel - 0.5 / yypos * height;
	var xpixel1 = xpixel + 0.5 / yypos * height;
	var ypixel0 = ypixel - 0.5 / yypos * height;
	var ypixel1 = ypixel + 0.5 / yypos * height;
	
	var xp0 = Math.floor(xpixel0);
	var xp1 = Math.floor(xpixel1);
	var yp0 = Math.floor(ypixel0);
	var yp1 = Math.floor(ypixel1);
	
	if (xp0 < 0) xp0 = 0;
	if (xp1 > width) xp1 = width;
	if (yp0 < 0) yp0 = 0;
	if (yp1 > height) yp1 = height;
	
	for (var x = xp0; x < xp1; x++) {
		if (yypos > zbuffer[x]) continue;
		else zbuffer[x] = yypos;
		
		for (var y = yp0; y < yp1; y++) {
			var xtex = (x - xpixel0) / (xpixel1 - xpixel0);
			var ytex = (y - ypixel0) / (ypixel1 - ypixel0);
			
			var xt = Math.floor(xtex * sprite.width);
			var yt = Math.floor(ytex * sprite.height);
			
			pixels[y * width + x] = sprite.pixels[yt * sprite.width + xt];
		}
	}
}

function raycast() {
	for (var x = 0; x < width; x++) {
		var x_camera = (x - width / 2.0) / height;
		
		var x_dir = Math.cos(dir);
		var y_dir = Math.sin(dir);
		
		var x_plane = -Math.sin(dir);
		var y_plane = +Math.cos(dir);
		
		var x_ray_dir = x_dir + x_plane * x_camera;
		var y_ray_dir = y_dir + y_plane * x_camera;
		
		var x_dist;
		var y_dist;
		
		var x_step;
		var y_step;
		
		var side = false;
		
		var x_map_pos = Math.floor(x_pos);
		var y_map_pos = Math.floor(y_pos);
		
		var x_step_dist = Math.abs(1 / x_ray_dir);
		var y_step_dist = Math.abs(1 / y_ray_dir);
		
		if (x_ray_dir < 0) {
			x_step = -1;
			x_dist = (x_pos - x_map_pos) * x_step_dist;
		} else {
			x_step = 1;
			x_dist = (x_map_pos + 1.0 - x_pos) * x_step_dist;
		}
		
		if (y_ray_dir < 0) {
			y_step = -1;
			y_dist = (y_pos - y_map_pos) * y_step_dist;
		} else {
			y_step = 1;
			y_dist = (y_map_pos + 1.0 - y_pos) * y_step_dist;
		}
		
		while (true) {
			if (x_dist < y_dist) {
				x_dist += x_step_dist;
				x_map_pos += x_step;
				
				side = false;
			} else {
				y_dist += y_step_dist;
				y_map_pos += y_step;
				
				side = true;
			}
			
			if (map[y_map_pos * 10 + x_map_pos] > 0) break;
		}
		
		var ray_dist;
		
		if (!side) 	ray_dist = (x_map_pos - x_pos + (1 - x_step) / 2) / x_ray_dir;
		else 		ray_dist = (y_map_pos - y_pos + (1 - y_step) / 2) / y_ray_dir;
		
		var x_wall;
		
		if (!side)	x_wall = ray_dist * y_ray_dir + y_pos;
		else		x_wall = ray_dist * x_ray_dir + x_pos;
		x_wall -= Math.floor(x_wall);
		
		x_wall = 1.0 - x_wall;
		
		if (!side && x_ray_dir > 0) x_wall = 1.0 - x_wall;
		if ( side && y_ray_dir < 0) x_wall = 1.0 - x_wall;
		
		var x_tex = Math.floor(x_wall * 16.0);
		
		var line_height = height / ray_dist / 2 + 1;
		
		var y_start = Math.floor(height / 2 - line_height + z_pos / ray_dist * height / 2);
		var y_end = Math.ceil(height / 2 + line_height + z_pos / ray_dist * height / 2);
		
		for (var y = 0; y < height; y++) {
			if (y > y_start && y < y_end) {
				var y_wall = (y - y_start) / line_height / 2.0;
				var y_tex = Math.floor(y_wall * 16.0);
				
				var color = wall.pixels[y_tex * wall.width + x_tex];
				
				pixels[y * width + x] = color;
				zbuffer[x] = ray_dist;
			} else {
				var cos = Math.cos(dir);
				var sin = Math.sin(dir);
				
				var y_depth = (y - height / 2.0) / height;
				var z_depth = (8.0 + z_pos * 8.0) / y_depth;
				
				if (z_depth < 0)
					z_depth = -(8.0 - z_pos * 8.0) / y_depth;
				
				var x_depth = (x - width / 2.0) / height;
				x_depth *= z_depth;
				
				var x_pixel = x_depth * cos + z_depth * sin + y_pos * 16;
				var y_pixel = z_depth * cos - x_depth * sin + x_pos * 16;
				
				var xp = Math.floor(x_pixel) & 15;
				var yp = Math.floor(y_pixel) & 15;
				
				pixels[y * width + x] = wall.pixels[yp * wall.width + xp];
			}
		}
	}
}