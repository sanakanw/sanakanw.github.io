
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

function new_phys_obj(pos, mass, col, vel)
{
	return {
		pos: pos,
		mass: mass,
		col: col,
		angular_velocity: Math.random() * 0.1 - 0.05,
		vel: vel
	};
}

function line(ctx, a, b)
{
	let cx = ctx.canvas.width / 2;
	let cy = ctx.canvas.height / 2;
	
	ctx.beginPath();
	ctx.moveTo(cx + a.x, cy - a.y);
	ctx.lineTo(cx + b.x, cy - b.y);
	ctx.stroke();
	ctx.closePath();
}

function point(ctx, p)
{
	let cx = ctx.canvas.width / 2;
	let cy = ctx.canvas.height / 2;
	
	ctx.fillRect(cx + p.x - 3, cy - p.y - 3, 6, 6);
}

function test_shape(a, b)
{
	let normal;
	let edge;
	let contact_point;
	
	let distance = 1000;
	
	for (let i = 0; i < a.col.length; i++) {
		let v0 = a.col[i];
		let v1 = a.col[(i + 1) % a.col.length];
		
		let side = normalize(sub(v0, v1));
		
		let n = vec2(-side.y, side.x);
		
		let a0 = +1000;
		let a1 = -1000;
		
		let b0 = +1000;
		let b1 = -1000;
		
		let p0, p1;
		
		for (let j = 0; j < a.col.length; j++) {
			let p = dot(add(a.pos, a.col[j]), n);
			
			if (p < b0) b0 = p;
			if (p > b1) b1 = p;
		}
		
		for (let j = 0; j < b.col.length; j++) {
			let p = dot(add(b.pos, b.col[j]), n);
			
			if (p < a0) { a0 = p; p0 = b.col[j]; }
			if (p > a1) { a1 = p; p1 = b.col[j]; }
		}
		
		if (a1 > b0 && a0 < b1) {
			let p;
			let mtv;
			if (a0 > b0) {
				p = p0;
				mtv = b1 - a0;
			} else {
				mtv = a1 - b0;
				p = p1;
			}
			
			if (mtv < distance) {
				distance = mtv;
				contact_point = p;
				edge = [v0, v1];
				normal = n;
			}
		} else {
			return undefined;
		}
	}
	
	return {
		d: distance,
		p: contact_point,
		edge: edge,
		normal: normal
	};
}

function sat_col(ctx, a, b)
{
	let col_a = test_shape(a, b);
	if (col_a == undefined)
		return undefined;
	
	let col_b = test_shape(b, a);
	if (col_b == undefined)
		return undefined;
	
	let col;
	if (col_a.d < col_b.d) {
		let n = normalize(sub(col_a.edge[0], col_a.edge[1]));
		let d = dot(sub(add(b.pos, col_a.p), add(a.pos, col_a.edge[0])), n);
		let p = add(col_a.edge[0], mulf(n, d));
		
		return {
			n: mulf(col_a.normal, 1),
			r1: p,
			r2: col_a.p
		};
	} else {
		let n = normalize(sub(col_b.edge[0], col_b.edge[1]));
		let d = dot(sub(add(a.pos, col_b.p), add(b.pos, col_b.edge[0])), n);
		let p = add(col_b.edge[0], mulf(n, d));
		
		return {
			n: mulf(col_b.normal, -1),
			r1: col_b.p,
			r2: p
		};
	}
}

function contact_constraint(ctx, a, b, h)
{
	let collision = sat_col(ctx, a, b);
	
	if (collision != undefined) {
		let r1 = collision.r1;
		let r2 = collision.r2;
		
		let n = collision.n;
		
		let j_v1 = vec2(n.x, n.y);
		let j_w1 = (-r1.x * n.y) - (-r1.y * n.x);
		let j_v2 = vec2(-n.x, -n.y);
		let j_w2 = (r2.x * n.y) - (r2.y * n.x);
		
		let k = 1 + 1 + j_w1 * j_w1 / length(r1) + j_w2 * j_w2 / length(r2);
		let jv = dot(j_v1, a.vel) + dot(j_v2, b.vel) + j_w1 * a.angular_velocity + j_w2 * b.angular_velocity;
		let effective_mass = 1 / k;
		
		let bias = 0.7 * dot(sub(add(a.pos, r1), add(b.pos, r2)), n);
		let lambda = -(jv + bias) * effective_mass;
		
		lambda = Math.max(lambda, 0);
		
		a.vel.x += lambda * j_v1.x;
		a.vel.y += lambda * j_v1.y
		a.angular_velocity += lambda * j_w1 / length(r1);
		
		b.vel.x += lambda * j_v2.x;
		b.vel.y += lambda * j_v2.y;
		b.angular_velocity += lambda * j_w2 / length(r2);
	}
}

function plane_constraint(object, normal, limit, h)
{
	for (let i = 0; i < object.col.length; i++) {
		let point = add(object.pos, object.col[i]);
		
		if (dot(point, normal) < dot(limit, normal)) {
			let r = object.col[i];
			
			let j_v = vec2(normal.x, normal.y);
			let j_w = -r.x * normal.y - -r.y * normal.x;
			
			let k = 1 + j_w * j_w / length(r);
			let jv = dot(j_v, object.vel) + j_w * object.angular_velocity;
			let effective_mass = 1 / k;
			
			let bias = 0.7 * (dot(point, normal) - dot(limit, normal));
			let lambda = -(jv + bias) * effective_mass;
			
			lambda = Math.max(lambda, 0);
			
			object.vel.x += lambda * j_v.x;
			object.vel.y += lambda * j_v.y;
			object.angular_velocity += lambda * j_w / length(r);
		}
	}
}

function apply_angular_velocity(object, h)
{
	let cos = Math.cos(-object.angular_velocity);
	let sin = Math.sin(-object.angular_velocity);
	
	for (let i = 0; i < object.col.length; i++) {
		let p = object.col[i];
		let v = mulf(vec2(p.y, -p.x), object.angular_velocity / h);
		
		let r = length(p);
		let n = normalize(add(p, v));
		
		p.x = n.x * r;
		p.y = n.y * r;
	}
}

let mouse = vec2(0, 0);

function update(ctx, box)
{
	let h = 5;
	
	box[0].vel.x += (mouse.x - box[0].pos.x) * 0.0005;
	box[0].vel.y += (mouse.y - box[0].pos.y) * 0.0005;
	
	for (let i = 0; i < box.length; i++) {
		box[i].vel.x *= 0.998;
		box[i].vel.y *= 0.998;
		box[i].angular_velocity *= 0.998;
		
		box[i].vel.y -= 0.05;
	}
	
	for (let i = 0; i < h; i++) {
		for (let i = 0; i < box.length; i++) {
			box[i].pos.x += box[i].vel.x / h;
			box[i].pos.y += box[i].vel.y / h;
			apply_angular_velocity(box[i], h);
		}
		
		for (let j = 0; j < box.length; j++) {
			let object = box[j];
			
			for (let k = j + 1; k < box.length; k++) {
				contact_constraint(ctx, object, box[k], h);	
			}
			
			plane_constraint(object, vec2(0, 1), vec2(0, -240), h);
			plane_constraint(object, vec2(0, -1), vec2(0, 240), h);
			plane_constraint(object, vec2(1, 0), vec2(-320, 0), h);
			plane_constraint(object, vec2(-1, 0), vec2(320, 0), h);
		}
	}
}

function render(ctx, box)
{
	let cx = ctx.canvas.width / 2;
	let cy = ctx.canvas.height / 2;
		
	point(ctx, box[0].pos);
	
	for (let i = 0; i < box.length; i++) {
		let object = box[i];
		
		for (let j = 0; j < object.col.length; j++) {
			let a = object.col[j];
			let b = object.col[(j + 1) % object.col.length];
			
			line(ctx, add(object.pos, a), add(object.pos, b));
		}
	}
}

function main()
{
	let c = document.getElementById("display");
	let ctx = c.getContext("2d");
	
	let box = [];
	
	let min = 10;
	let max = 40;
	
	for (let i = 0; i < 20; i++) {
		let xpos = -300 + 400 * Math.random();
		let ypos = -200 + 200 * Math.random();
		
		let v = min + Math.random() * (max - min);
		
		let s = v;
		let r = 10 * (v / max);
		
		box.push(new_phys_obj(vec2(xpos, ypos), 1, [
			vec2(-s + Math.random() * r,  s + Math.random() * r),
			vec2( s + Math.random() * r,  s + Math.random() * r),
			vec2( s + Math.random() * r, -s + Math.random() * r),
			vec2(-s + Math.random() * r, -s + Math.random() * r),
		], vec2(0, 0)));
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
		
		let v = min + Math.random() * (max - min);
		
		let s = v;
		let r = 10 * (v / max);
		
		box.push(new_phys_obj(pos, 1, [
			vec2(-s + Math.random() * r,  s + Math.random() * r),
			vec2( s + Math.random() * r,  s + Math.random() * r),
			vec2( s + Math.random() * r, -s + Math.random() * r),
			vec2(-s + Math.random() * r, -s + Math.random() * r),
		], vec2(0, 0)));
	});
	
	c.addEventListener("mousemove", function(e) {
		let mx = e.offsetX - c.width / 2.0;
		let my = c.height / 2.0 - e.offsetY;
		
		mouse = vec2(mx, my);
	});
	
	setInterval(function() {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		update(ctx, box);
		render(ctx, box);
	}, 10);
}

(function() {
	main();
})();
