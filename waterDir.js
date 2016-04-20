var canvas = document.getElementById('canvas'),
	ctx = canvas.getContext('2d'),
	width = canvas.width = window.innerWidth,
	height = canvas.height = window.innerHeight,
	min = 1.25,
	timer = 0,
	deltaTime = 0,
	lastTime = Date.now(),
	buffer0 = [],
	buffer1 = [],
	aux;

// Options
var Options = function() {
	this.map = {
		width: 45, 
		height: 45,
	};
	this.map.size = this.map.width * this.map.height;
	this.width = 30;
	this.height = 12.5;
	this.speed = 5;
	this.strength = 500;
	this.maxWaveHeight = 20;
	this.direction = 'x';
	this.color = {
		top : '#2AF',
		right : '#19E',
		left : '#07C',
		r : 34, // 17 // 0
		g : 170, // 153 // 119
		b : 250, // 238 // 204
		offset : 10,
		step : 5,
		base : 0,
		direction : {
			r : true,
			g : true,
			b : true
		},
		update : function () {
			this.r = this.direction.r ? (this.r + this.step) : (this.r - this.step);
			if (this.r >=255 - this.offset*2) {
				this.direction.r = false;
			} else if (this.r <=0) {
				this.direction.r = true;
			}
			this.g = this.direction.g ? (this.g + this.step) : (this.g - this.step);
			if (this.g >=255 - this.offset*2) {
				this.direction.g = false;
			} else if (this.g <=0) {
				this.direction.g = true;
			}
			this.b = this.direction.b ? (this.b + this.step) : (this.b - this.step);
			if (this.b >=255 - this.offset*2) {
				this.direction.b = false;
			} else if (this.b <=0) {
				this.direction.b = true;
			}
		},
		makeRGB : function (z) {
			var r = this.r;
			var b = this.b;
			// var r = (255 - this.r);
			// var b = (255 - this.b);

			var r2 = this.r + this.offset * 2;
			var b2 = this.b + this.offset * 2;
			// var r2 = 150 - (this.r + this.offset);
			// var b2 = 150 - (this.b + this.offset);

			var r3 = this.r + this.offset * 5;
			var b3 = this.b + this.offset * 5;

			var k = 1.7;
			// var k = this.k;
			// var k = ~~(Math.random() * 3); 

			return {
				top   : 'rgb(' + r  + ', ' + (215 - (~~((z - k) * 100))) + ', ' + b  + ')',
				left  : 'rgb(' + r2 + ', ' + (235 - (~~((z - k) * 100))) + ', ' + b2 + ')',
				right : 'rgb(' + r3 + ', ' + (255 - (~~((z - k) * 100))) + ', ' + b3 + ')'
			}
		}
	}
};

var options = new Options();

for (var i = 0; i < options.map.size; i++) {
    buffer0.push(0);
    buffer1.push(0);
}

ctx.translate(width / 2, 100);

window.onresize = function() {
	width = canvas.width = window.innerWidth;
	height = canvas.height = window.innerHeight;
	ctx.translate(width / 2, 100);
};

canvas.onmousedown = function(e){
    disturb(
	    ~~(Math.random() * (options.map.width - 3)) + 2,
	    ~~(Math.random() * (options.map.height - 3)) + 2,
	    // options.map.width/2,
	    // options.map.width/2,
	    options.strength);
}

function disturb(x, y, z){
    var i = x + y * options.map.width;

    buffer0[i] += z;
    buffer0[i-1] -= z;

}
// disturb(
// 	    options.map.width/2,
// 	    options.map.width/2,
// 	    options.strength);
setInterval(process, 1000/30);

function process() {

	deltaTime = Date.now() - lastTime;
	lastTime = Date.now();
	timer += options.speed * deltaTime / 1000;

	options.color.update();

	ctx.clearRect(-width / 2, -100, width, height);

	for(var y = 1; y < options.map.height - 1; y++) {
	    for(var x = 1; x < options.map.width - 1; x++) {
	    	var i = y * options.map.height + x;

            buffer0[i] = (buffer0[i]+buffer0[i + 1] + buffer0[i - 1] + buffer0[i - options.map.width] + buffer0[i + options.map.width]) / 5;
        }
    }

    for(var y = 1; y < options.map.height - 1; y++) {
	    for(var x = 1; x < options.map.width - 1; x++) {
	    	var i = y * options.map.height + x;
	    	// debugger;

	    	var velocity = -buffer1[i];
	    	var smoothed = (buffer0[i - 1] + buffer0[i + 1] + buffer0[i + options.map.width] + buffer0[i - options.map.width]) / 4;
            var waveHeight = smoothed * 2 + velocity;
            // var damping = 0.005;
            var damping = 0;

            buffer1[i] = waveHeight - damping;

            // var drawHeight = waveHeight < -5 ? 0 : waveHeight;
            var drawHeight = waveHeight < -5 ? 0 : waveHeight > options.maxWaveHeight ? options.maxWaveHeight : waveHeight;

            drawBlock(x, y, drawHeight + 3);
	    }
    }

    aux = buffer0;
    buffer0 = buffer1;
    buffer1 = aux;
}

/**
 * drawBlock
 * - Draw an isometric block
 *
 * @param {number} x - The position on X
 * @param {number} y - The position on Y
 * @param {number} z - The height of the block
 */
function drawBlock(x, y, z) {

	var gamma = options.color.makeRGB(z);

	var top = gamma.top;
	var right = gamma.right;
	var left = gamma.left;

	ctx.save();
	ctx.translate((x - y) * options.width / 2, (x + y) * options.height / 2);

	// Top
	ctx.beginPath();
	// Эффект чешуи
	// ctx.moveTo(0, -z * options.height + 2);
	ctx.moveTo(0, -z * options.height);
	ctx.lineTo(options.width / 2, options.height / 2 - z * options.height);
	ctx.lineTo(0, options.height - z * options.height);
	ctx.lineTo(-options.width / 2, options.height / 2 - z * options.height);
	ctx.closePath();
	ctx.fillStyle = top;
	// ctx.fillStyle = 'rgb(' + 80 + ', ' + (255 - (~~((z - 1.7) * 100))) + ', ' + 255 + ')';
	ctx.fill();
	// ctx.strokeStyle = left;
	// ctx.strokeStyle = 'rgb(80, ' + (255 - (~~((z - 1.7) * 100))) + ', 255)';
	// ctx.stroke();

	// Left
	ctx.beginPath();
	ctx.moveTo(-options.width / 2, options.height / 2 - z * options.height);
	ctx.lineTo(0, options.height - z * options.height);
	ctx.lineTo(0, options.height);
	ctx.lineTo(-options.width / 2, options.height / 2);
	ctx.closePath();
	ctx.fillStyle = left;
	ctx.fill();
	// ctx.strokeStyle = left;
	// ctx.stroke();

	// Right
	ctx.beginPath();
	ctx.moveTo(options.width / 2, options.height / 2 - z * options.height);
	ctx.lineTo(0, options.height - z * options.height);
	ctx.lineTo(0, options.height);
	ctx.lineTo(options.width / 2, options.height / 2);
	ctx.closePath();
	ctx.fillStyle = right;
	ctx.fill();
	// ctx.strokeStyle = right;
	// ctx.stroke();

	ctx.restore();

}