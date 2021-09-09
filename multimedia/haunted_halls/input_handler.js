display.requestPointerLock = display.requestPointerLock || display.mozRequestPointerLock;

var mouse_x = 0;
var mouse_y = 0;

var forward = false;
var left = false;
var back = false;
var right = false;

var mouse_left = false;
var mouse_right = false;

document.addEventListener("pointerlockchange", function(e) {
	if (document.pointerLockElement == display ||
		document.mozPointerLockElement == display) {
		document.addEventListener("mousemove", mouse_callback, false);
		document.addEventListener("keydown", keydown_callback);
		document.addEventListener("keyup", keyup_callback);
		document.addEventListener("mousedown", mouse_down_callback);
		document.addEventListener("mouseup", mouse_up_callback);
	} else {
		document.removeEventListener("mousemove", mouse_callback, false);
		document.removeEventListener("keydown", keydown_callback);
		document.removeEventListener("keyup", keyup_callback);
		document.removeEventListener("mousedown", mouse_down_callback);
		document.removeEventListener("mouseup", mouse_up_callback);
	}
});

function mouse_callback(e) {
	var movement_x = e.movementX || e.mozMovementX;
	var movement_y = e.movementY || e.mozMovementY;
	
	if (movement_x != undefined) mouse_x += movement_x;
	if (movement_y != undefined) mouse_y += movement_y;
}

function mouse_down_callback(e) {
	if (e.button == 0) mouse_left = true;
	if (e.button == 2) mouse_right = true;
}

function mouse_up_callback(e) {
	if (e.button == 0) mouse_left = false;
	if (e.button == 2) mouse_right = false;
}

function keydown_callback(e) {
	if (e.keyCode == 87) forward	= true;
	if (e.keyCode == 65) left 		= true;
	if (e.keyCode == 83) back 		= true;
	if (e.keyCode == 68) right		= true;
}

function keyup_callback(e) {
	if (e.keyCode == 87) forward	= false;
	if (e.keyCode == 65) left 		= false;
	if (e.keyCode == 83) back 		= false;
	if (e.keyCode == 68) right		= false;
}

display.addEventListener("click", function() {
	display.requestPointerLock();
});

