var display = document.getElementById("display");

var width = display.width;
var height = display.height;

var ctx = display.getContext("2d");
ctx.imageSmoothingEnabled = false;

var ticks = 0;

var spritesloaded = 0;

var logo = loadimage('logo.png');
var logo_cyan = loadimage('logo_cyan.png');
var logo_magenta = loadimage('logo_magenta.png');

var player_anim1 = loadimage('player.png');
var player_anim2 = loadimage('player2.png');

var enemy_anim1 = loadimage('enemy.png');
var enemy_anim2 = loadimage('enemy2.png');

var playerbullet = loadimage('playerbullet.png');
var enemybullet = loadimage('enemybullet.png');

var fov = height / 20.0;

var max_enemies = 3;

var bulletarr = [];
var enemyarr = [];

ctx.fillStyle = "#ffffff";
ctx.font = "30px consolas";
ctx.textAlign = "center";

var player = {
	xpos: 0.0,
	ypos: 0.0,
	spd: 0.2,
	next_fire: 0,
	score: 0,
	hp: 20
};

function tick() {
	if (ticks < 240)
		return;
	
	if (player.hp > 0) {
		enemytick();
		playertick();
	} else {
		if (restart) {
			player = {
				xpos: 0.0,
				ypos: 0.0,
				spd: 0.2,
				next_fire: 0,
				score: 0,
				hp: 20
			};
			
			bulletarr = [];
			enemyarr = [];
		}
	}
	
	bullettick();
}

function render() {
	if (spritesloaded < 9)
		return;
	
	ctx.clearRect(0, 0, width, height);
	
	if (ticks < 240) {
		renderlogo();
		return;
	}
	
	if (player.hp > 0)
		renderplayer();
	else {
		ctx.fillText("YOU LOSE!", width / 2, height / 2 - 60);
		ctx.fillText("SCORE " + player.score, width / 2, height / 2 - 60 + 30 + 10);
		ctx.fillText("PRESS 'R' TO RESTART", width / 2, height / 2 - 60 + 30 + 10 + 30 + 10);
	}
	
	renderstars();
	renderenemy();
	renderbullets();
}

function playertick() {
	var xvel = 0.0;
	var yvel = 0.0;

	if (forward) 	yvel += player.spd;
	else if (back) 	yvel -= player.spd;
	
	if (right) 		xvel += player.spd;
	else if (left) 	xvel -= player.spd;
	
	var distance_moved = Math.sqrt((xvel * xvel) + (yvel * yvel));
	
	if (distance_moved > player.spd) {
		xvel *= player.spd / distance_moved;
		yvel *= player.spd / distance_moved;
	}
	
	if (player.xpos + xvel > -10 && player.xpos + xvel < 10) player.xpos += xvel;
	if (player.ypos + yvel > -10 && player.ypos + yvel < 10) player.ypos += yvel;
	
	if (fire && ticks > player.next_fire) {
		projectile(true, 0.0, 0.5, player.xpos, player.ypos);
		player.next_fire = ticks + 10;
	}
}

var enemyspd = 0.05;

function enemytick() {
	if (ticks % 120 == 0 && ticks > 360) {
		if (enemyarr.length < max_enemies) {
			var enemy = {
				xpos: Math.random() * 20 - 10,
				ypos: Math.random() * 6 + 3,
				hp: 8,
				time: ticks
			};
			
			enemyarr.push(enemy);
		}
		
		max_enemies = Math.floor(player.score / 5) + 3;
	}
	
	for (var i = 0; i < enemyarr.length; i++) {
		if (enemyarr[i].hp < 0) {
			enemyarr.splice(i, 1);
			i = 0;
			
			player.score++;
			
			continue;
		}
		
		var xvel = player.xpos - enemyarr[i].xpos;
		var yvel = 6 + Math.random() * 5 - enemyarr[i].ypos;
		
		xvel = 2.0 / xvel;
		
		for (var j = 0; j < enemyarr.length; j++) {
			var dx = enemyarr[i].xpos - enemyarr[j].xpos;
			var dy = enemyarr[i].ypos - enemyarr[j].ypos;
			
			var dist = Math.sqrt((dx * dx) + (dy * dy));
			
			if (dist < 2)
				xvel += dx;
		}
		
		var distance_moved = Math.sqrt((xvel * xvel) + (yvel * yvel));
		
		if (distance_moved > enemyspd) {
			xvel *= enemyspd / distance_moved;
			yvel *= enemyspd / distance_moved;
		}
		
		if (enemyarr[i].xpos + xvel > -10 && enemyarr[i].xpos + xvel < 10) enemyarr[i].xpos += xvel;
		if (enemyarr[i].ypos + yvel > -10 && enemyarr[i].ypos + yvel < 10) enemyarr[i].ypos += yvel;
		
		if (ticks % 30 == 0) {
			if (Math.random() < 0.5) {
				for (var j = -1; j < 2; j++)
					projectile(false, j * 0.03, -0.1, enemyarr[i].xpos, enemyarr[i].ypos);
			}
		}
	}
}

function bullettick() {
	for (var i = 0; i < bulletarr.length; i++) {
		if (ticks - bulletarr[i].time > 360) {
			bulletarr.splice(i, 1);
			i = 0;
			
			continue;
		}
		
		if (bulletarr[i].playerowned) {
			for (var j = 0; j < enemyarr.length; j++) {
				var dx = bulletarr[i].xpos - enemyarr[j].xpos;
				var dy = bulletarr[i].ypos - enemyarr[j].ypos;
				
				var dist = Math.sqrt((dx * dx) + (dy * dy));
				
				if (dist < 0.5) {
					bulletarr.splice(i, 1);
					i = 0;
					
					enemyarr[j].hp -= 1;
					
					continue;
				}
			}
		} else {			
			var dx = bulletarr[i].xpos - player.xpos;
			var dy = bulletarr[i].ypos - player.ypos;
			
			var dist = Math.sqrt((dx * dx) + (dy * dy));
			
			if (dist < 0.5) {
				bulletarr.splice(i, 1);
				i = 0;
				
				player.hp -= 1;
				
				continue;
			}
		}
		
		bulletarr[i].xpos += bulletarr[i].xdir;
		bulletarr[i].ypos += bulletarr[i].ydir;
	}
}

function renderenemy() {
	for (var i = 0; i < enemyarr.length; i++) {
		var xpixel = enemyarr[i].xpos * fov + width / 2.0 - fov / 2.0;
		var ypixel = enemyarr[i].ypos * -fov + height / 2.0 - fov / 2.0;
		
		ctx.drawImage(ticks % 20 < 10 ? enemy_anim1 : enemy_anim2, xpixel, ypixel, fov, fov);
	}
}

function renderplayer() {
	var xpixel = player.xpos * fov + width / 2.0 - fov / 2.0;
	var ypixel = player.ypos * -fov + height / 2.0 - fov / 2.0;
	
	ctx.drawImage(ticks % 20 < 10 ? player_anim1 : player_anim2, xpixel, ypixel, fov, fov);
	ctx.fillStyle = "#ff0000";
	ctx.fillRect(xpixel, ypixel + fov + 3, player.hp / 20 * fov, 3);
}

function renderbullets() {
	for (var i = 0; i < bulletarr.length; i++) {
		var xpixel = bulletarr[i].xpos * fov + width / 2.0 - fov / 2.0;
		var ypixel = bulletarr[i].ypos * -fov + height / 2.0 - fov / 2.0;
		
		ctx.drawImage(bulletarr[i].playerowned ? playerbullet : enemybullet, xpixel, ypixel, fov, fov);
	}
}

function renderstars() {
	ctx.fillStyle = "#ffffff";
	
	for (var i = 0; i < 20; i++) {
		var xpixel = (Math.random() * 30 - 15) * fov + width / 2.0 - fov / 2.0;
		var ypixel = (Math.random() * 20 - 10) * -fov + height / 2.0 - fov / 2.0;
		
		ctx.fillRect(xpixel, ypixel, 2, 2);
	}
}

function renderlogo() {
	var yheight = 3.0;
	var zdepth = 30;
	var zpos = ticks / 60.0;
	
	for (var z = 0; z < zdepth / 2.0 + 2; z++) {
		var ypixel = yheight / (z * 2.0 - zpos) * (height / 2.0) + height / 2.0;
		
		if (z * 2.0 - zpos < 0) continue;
		
		ctx.fillStyle = "#ff00ff";
		ctx.fillRect(0, Math.floor(ypixel), width, 1);
		ctx.fillStyle = "#ffffff";
	}
	
	for (var x = -50; x < 50; x++) {
		var xpixel0 = (x * 2.0) / 1.0 * (height / 2.0) + width / 2.0;
		var xpixel1 = (x * 2.0) / zdepth * (height / 2.0) + width / 2.0;
		
		var ypixel0 = yheight / 1.0 * (height / 2.0) + height / 2.0;
		var ypixel1 = yheight / zdepth * (height / 2.0) + height / 2.0;
		

		ctx.strokeStyle = "#ff00ff";

		ctx.beginPath();
			ctx.moveTo(xpixel1, ypixel1);
			ctx.lineTo(xpixel0, ypixel0);
		ctx.stroke();

		ctx.strokeStyle = "#ffffff";
	}
	
	if (ticks < 180) {
		ctx.globalAlpha = ticks / 240.0;
		ctx.drawImage(logo, 272, 172, 256, 256);
	} else if (ticks < 240) {
		ctx.globalAlpha = 1.0;
		ctx.drawImage(logo, 272, 172, 256, 256);
		ctx.globalAlpha = 0.5;
		
		var xtick = (ticks - 240) / 60 * 10;
		
		ctx.drawImage(logo_cyan, 272 - xtick, 172 - 10, 256, 256);
		ctx.drawImage(logo_magenta, 272 + xtick, 172 + 10, 256, 256);
		ctx.globalAlpha = 1.0;
	}
}

function projectile(_playerowned, _xdir, _ydir, _xorig, _yorig) {
	var bullet = {
		xdir: _xdir,
		ydir: _ydir,
		xpos: _xorig,
		ypos: _yorig,
		time: ticks,
		playerowned: _playerowned
	};
	
	bulletarr.push(bullet);
}

var previous_time = new Date().getTime();
var seconds_per_tick = 1.0 / 60.0;
var unprocessed_time = 0.0;

var loop_function;

function start() {
	loop_function = setInterval(function() {
		var current_time = new Date().getTime();
		var elapsed_time = current_time - previous_time;
		previous_time = current_time;
		
		unprocessed_time += elapsed_time / 1000.0;
		
		while (unprocessed_time > seconds_per_tick) {
			unprocessed_time -= seconds_per_tick;
			
			tick();
			
			ticks++;
		}
		
		render();		
	}, 10);
}

start();

function loadimage(imgsrc) {
	var image = new Image();
	
	image.onload = function() {
		spritesloaded++;
	};
	
	image.src = imgsrc;
	
	return image;
}