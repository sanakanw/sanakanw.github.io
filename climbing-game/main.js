
const WIDTH							= 640;
const HEIGHT						= 480;

const COLUMN_NUM				= 4;

const SHAPE_SQUARE			= 0;
const SHAPE_TRIANGLE		= 1;
const SHAPE_CIRCLE			= 2;
const SHAPE_PENTAGON		= 3;


function vertex_new(x, y)
{
	return {
		x: x,
		y: y
	};
}

const vertices_square  = [
	vertex_new(40, 40),
	vertex_new(120, 40),
	vertex_new(120, 120),
	vertex_new(40, 120)
];

const vertices_triangle = [
	vertex_new(80, 40),
	vertex_new(40, 120),
	vertex_new(120, 120)
];

const vertices_pentagon = [
	vertex_new(80, 40),
	vertex_new(40, 70),
	vertex_new(55, 120),
	vertex_new(105, 120),
	vertex_new(120, 70)
];

function shape_new(type, column)
{
	return {
		type: type,
		column: column
	};
}

function draw_poly(ctx, vertices, xpos, ypos)
{
	for (let i = 0; i < vertices.length; i++) {
		let v0 = vertices[i];
		let v1 = vertices[(i + 1) % vertices.length];
		
		ctx.beginPath();
		ctx.moveTo(xpos + v0.x, ypos + v0.y);
		ctx.lineTo(xpos + v1.x, ypos + v1.y);
		ctx.stroke();
		ctx.closePath();
	}
}

function draw_circle(ctx, xpos, ypos)
{
	ctx.beginPath();
	ctx.arc(xpos + 80, ypos + 80, 40, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.closePath();
}

function draw_stage(ctx, player, shapes)
{
	ctx.clearRect(0, 0, WIDTH, HEIGHT);
	
	for (let i = 0; i < shapes.length; i++) {
		let xpos = shapes[i].column * WIDTH / COLUMN_NUM;
		let ypos = HEIGHT - (1 + i - player.scroll) * WIDTH / COLUMN_NUM;
		
		switch (shapes[i].type) {
		case SHAPE_SQUARE:
			draw_poly(ctx, vertices_square, xpos, ypos);
			break;
		case SHAPE_TRIANGLE:
			draw_poly(ctx, vertices_triangle, xpos, ypos);
			break;
		case SHAPE_PENTAGON:
			draw_poly(ctx, vertices_pentagon, xpos, ypos);
			break;
		case SHAPE_CIRCLE:
			draw_circle(ctx, xpos, ypos);
			break;
		}
	}
	
	for (let i = 1; i < COLUMN_NUM; i++) {
		let xpos = i * WIDTH / COLUMN_NUM;
		
		ctx.beginPath();
		ctx.moveTo(xpos, 0);
		ctx.lineTo(xpos, ctx.canvas.height);
		ctx.stroke();
		ctx.closePath();
	}
}

function shape_click(shape_type, player, shapes)
{
	if (shapes[player.scroll].type == shape_type) {
		player.scroll++;
	} else {
		alert("wrong shape");
		player.scroll = 0;
	}
	
	if (player.scroll == shapes.length) {
		alert("you win");
		location.reload();
	}
}

function main()
{
	let c = document.getElementById("display");
	let ctx = c.getContext("2d");
	
	let shapes = [];
	
	for (let i = 0; i < 10; i++) {
		let shape = Math.floor(Math.random() * (SHAPE_PENTAGON + 1));
		let column = Math.floor(Math.random() * COLUMN_NUM);
		
		shapes.push(shape_new(shape, column));
	}
	
	let player = {
		scroll: 0
	};
	
	let square_click = function(e)
	{
		shape_click(SHAPE_SQUARE, player, shapes);
		draw_stage(ctx, player, shapes);
	};
	
	let triangle_click = function(e)
	{
		shape_click(SHAPE_TRIANGLE, player, shapes);
		draw_stage(ctx, player, shapes);
	};
	
	let circle_click = function(e)
	{
		shape_click(SHAPE_CIRCLE, player, shapes);
		draw_stage(ctx, player, shapes);
	};
	
	let pentagon_click = function(e)
	{
		shape_click(SHAPE_PENTAGON, player, shapes);
		draw_stage(ctx, player, shapes);
	};
	
	document.getElementById("square").addEventListener("click", square_click);
	document.getElementById("triangle").addEventListener("click", triangle_click);
	document.getElementById("circle").addEventListener("click", circle_click);
	document.getElementById("pentagon").addEventListener("click", pentagon_click);
	
	draw_stage(ctx, player, shapes);
}

(function() {
	main();
})();
