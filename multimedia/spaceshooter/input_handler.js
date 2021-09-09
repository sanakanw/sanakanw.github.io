var forward = false;
var left = false;
var back = false;
var right = false;

var fire = false;

var restart = false;

document.addEventListener("keydown", keydown_callback);
document.addEventListener("keyup", keyup_callback);

function keydown_callback(e) {
	if (e.keyCode == 87) forward	= true;
	if (e.keyCode == 65) left 		= true;
	if (e.keyCode == 83) back 		= true;
	if (e.keyCode == 68) right		= true;
	
	if (e.keyCode == 32) fire		= true;
	if (e.keyCode == 82) restart = true;
}

function keyup_callback(e) {
	if (e.keyCode == 87) forward	= false;
	if (e.keyCode == 65) left 		= false;
	if (e.keyCode == 83) back 		= false;
	if (e.keyCode == 68) right		= false;
	
	if (e.keyCode == 32) fire		= false;
	if (e.keyCode == 82) restart = false;
}