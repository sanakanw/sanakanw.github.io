
function vec2(x, y)
{
	return {
		x: x,
		y: y
	};
}

function sub(a, b)
{
	return vec2(a.x - b.x, a.y - b.y);
}

function length(v)
{
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v)
{
	let l = length(v);
	return vec2(v.x / l, v.y / l);
}

function dot(a, b)
{
	return a.x * b.x + a.y * b.y;
}

function new_phys_obj(pos, mass, vel)
{
	return {
		pos: pos,
		mass: mass,
		vel: vel
	};
}

function constrain_static(a, b)
{
	let n = normalize(sub(a.pos, b.pos));
	
	let j_v = vec2(n.x, n.y);
	
	let beta = 0.1 * (length(sub(a.pos, b.pos)) - 40);
	
	let k = 1 / a.mass;
	let effective_mass = 1 / k;
	
	let jv = dot(j_v, a.vel);
	let lambda = -(jv + beta) * effective_mass;
	
	a.vel.x += lambda * j_v.x;
	a.vel.y += lambda * j_v.y;
}

function constrain_dynamic(a, b)
{
	let n = normalize(sub(a.pos, b.pos));
	
	let j_v1 = vec2(n.x, n.y);
	let j_v2 = vec2(-n.x, -n.y);
	
	let beta = 0.1 * (length(sub(a.pos, b.pos)) - 40);
	
	let k = 1 / a.mass + 1 / b.mass;
	let effective_mass = 1 / k;
	
	let jv = dot(j_v1, a.vel) + dot(j_v2, b.vel);
	let lambda = -(jv + beta) * effective_mass;
	
	a.vel.x += lambda * j_v1.x;
	a.vel.y += lambda * j_v1.y;
	
	b.vel.x += lambda * j_v2.x;
	b.vel.y += lambda * j_v2.y;
}

function ogey(a, b)
{
	let j = normalize(sub(b, a.pos));
}

let mouse_x = 0;
let mouse_y = 0;

let move = false;

function update(chain)
{
	let h = 5;
	
	for (let i = 1; i < chain.length; i++) {
		chain[i].vel.x *= 0.998;
		chain[i].vel.y *= 0.998;
		chain[i].vel.y -= 0.07;
	}
	
	if (move) {
		let p = chain[chain.length - 1];
		
		p.vel.x += (mouse_x - p.pos.x) * 0.005;
		p.vel.y += (mouse_y - p.pos.y) * 0.005;
	}
	
	for (let i = 0; i < h; i++) {
		for (let j = 1; j < chain.length; j++) {
			chain[j].pos.x += chain[j].vel.x;
			chain[j].pos.y += chain[j].vel.y;
		}
		
		constrain_static(chain[1], chain[0]);
		
		for (let i = 1; i < chain.length - 1; i++) {
			let a = chain[i];
			let b = chain[i + 1];
			
			constrain_dynamic(a, b, 5);
		}
	}
}

function render(chain, ctx)
{
	let cx = ctx.canvas.width / 2;
	let cy = ctx.canvas.height / 2;
	
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	ctx.beginPath();
	ctx.arc(cx + chain[0].pos.x, cy - chain[0].pos.y, 6, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.closePath();
	
	for (let i = 1; i < chain.length; i++) {
		let a = chain[i];
		let b = chain[i - 1];
		
		ctx.beginPath();
		ctx.moveTo(cx + a.pos.x, cy - a.pos.y);
		ctx.lineTo(cx + b.pos.x, cy - b.pos.y);
		ctx.stroke();
		ctx.closePath();
		
		ctx.beginPath();
		ctx.arc(cx + a.pos.x, cy - a.pos.y, 6, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.closePath();
	}
}

function main()
{
	let c = document.getElementById("display");
	let ctx = c.getContext("2d");
	
	let chain = [];
	
	document.addEventListener("mousedown", function(e) {
		move = true;
	});
	
	document.addEventListener("mouseup", function(e) {
		move = false;
	});
	
	document.addEventListener("mousemove", function(e) {
		mouse_x = e.offsetX - c.width / 2;
		mouse_y = -e.offsetY + c.height / 2;
	});
		
	for (let i = 0; i < 6; i++)
		chain.push(new_phys_obj(vec2(i * 20, -i * 40), 1, vec2(0, 0)));
	
	setInterval(function() {
		update(chain);
		render(chain, ctx);
	}, 10);
}

(function() {
	main();
})();
