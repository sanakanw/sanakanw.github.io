
function vec2(x, y)
{
	return {
		x: x,
		y: y
	};
}

function add(a, b)
{
	return vec2(a.x + b.x, a.y + b.y);
}

function sub(a, b)
{
	return vec2(a.x - b.x, a.y - b.y);
}

function mulf(a, b)
{
	return vec2(a.x * b, a.y * b);
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
		angle: 0,
		mass: mass,
		radius: mass * 10,
		angular_velocity: 0,
		vel: vel
	};
}

function plane_constraint(object, normal, limit)
{
	if (dot(object.pos, normal) - object.radius < dot(limit, normal)) {
		let j = normal;
		let m = 1 / object.mass;
		let jv = dot(j, object.vel);
		
		let beta = 0.1 * (dot(object.pos, normal) - object.radius - dot(limit, normal)) + 0.6 * jv;
		let lambda = -(jv + beta) / m;
		
		object.vel.x += lambda * j.x / object.mass;
		object.vel.y += lambda * j.y / object.mass;
	}
}

function contact_constraint(a, b, h)
{
	let delta = sub(a.pos, b.pos);
	
	if (length(delta) < a.radius + b.radius) {
		let r1 = mulf(normalize(delta), -a.radius);
		let r2 = mulf(normalize(delta), b.radius);
		
		let n = normalize(sub(a.pos, b.pos));
		
		let j_v1 = vec2(-n.x, -n.y);
		let j_w1 = (-r1.x * n.y) - (-r1.y * n.x);
		let j_v2 = vec2(n.x, n.y);
		let j_w2 = (r2.x * n.y) - (r2.y * n.x);
		
		let jv_v1 = dot(j_v1, a.vel);
		let jv_w1 = j_w1 * a.angular_velocity;
		let jv_v2 = dot(j_v2, b.vel);
		let jv_w2 = j_w2 * b.angular_velocity;
		
		let m = 1 / a.mass + 1 / b.mass;
		
		let beta = 0.1 * dot(delta, n);
		
		let lambda_v1 = -(jv_v1 + beta) / m;
		let lambda_w1 = -(jv_w2 + beta) / m;
		let lambda_v2 = -(jv_v2 + beta) / m;
		let lambda_w2 = -(jv_w2 + beta) / m;
		
		a.vel.x += lambda_v1 * j_v1.x / a.mass / h;
		a.vel.y += lambda_v1 * j_v1.y / a.mass / h;
		a.angular_velocity += lambda_w1 * j_w1 / h;
		
		b.vel.x += lambda_v2 * j_v2.x / b.mass / h;
		b.vel.y += lambda_v2 * j_v2.y / b.mass / h;
		b.angular_velocity += lambda_w2 * j_w2 / h;
	}
}

function update(box)
{
	for (let i = 0; i < box.length; i++) {
		box[i].vel.x *= 0.998;
		box[i].vel.y *= 0.998;
		
		box[i].vel.y -= 0.05;
	}
	
	let h = 20;
	
	for (let i = 0; i < h; i++) {
		for (let i = 0; i < box.length; i++) {
			box[i].pos.x += box[i].vel.x / h;
			box[i].pos.y += box[i].vel.y / h;
			box[i].angle += box[i].angular_velocity / h;
		}
		
		for (let j = 0; j < box.length; j++) {
			let object = box[j];
			
			for (let k = j + 1; k < box.length; k++) {
				contact_constraint(object, box[k], h);
			}
			
			plane_constraint(object, vec2(0, 1), vec2(0, -240));
			plane_constraint(object, vec2(0, -1), vec2(0, 240));
			plane_constraint(object, vec2(1, 0), vec2(-320, 0));
			plane_constraint(object, vec2(-1, 0), vec2(320, 0));
		}
	}
}

function render(box, ctx)
{
	let cx = ctx.canvas.width / 2;
	let cy = ctx.canvas.height / 2;
	
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	for (let i = 0; i < box.length; i++) {
		let object = box[i];
		
		let ax = object.pos.x;
		let ay = object.pos.y;
		
		ctx.beginPath();
		ctx.arc(cx + ax, cy - ay, object.radius, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.closePath();
	}
}

function main()
{
	let c = document.getElementById("display");
	let ctx = c.getContext("2d");
	
	let box = [];
	for (let i = 0; i < 30; i++) {
		let xpos = -300 + 600 * Math.random();
		let ypos = -200 + 400 * Math.random();
		
		box.push(new_phys_obj(vec2(xpos, ypos), 1 + Math.random(), vec2(0, 0)));
	}
	
	let slider = document.getElementById("boom");
	
	c.addEventListener("click", function(e) {
		let centre = vec2(e.offsetX - c.width / 2.0, c.height / 2.0 - e.offsetY);
		
		for (let i = 0; i < box.length; i++) {
			let force = sub(box[i].pos, centre);
			let distance = length(force);
			force = normalize(force);
			force = vec2(force.x, force.y);
			force = mulf(force, slider.value / distance);
			
			box[i].vel.x += force.x / box[i].mass;
			box[i].vel.y += force.y / box[i].mass;
		}
	});
	
	c.addEventListener("contextmenu", function(e) {
		e.preventDefault();
		let pos = vec2(e.offsetX - c.width / 2.0, c.height / 2.0 - e.offsetY);
		box.push(new_phys_obj(pos, 1 + Math.random(), vec2(0, 0)));
	});
	
	setInterval(function() {
		update(box);
		render(box, ctx);
	}, 10);
}

(function() {
	main();
})();
