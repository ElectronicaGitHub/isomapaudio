window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new window.AudioContext();
var source, vs;

if (!context.createGain) context.createGain = context.createGainNode;
if (!context.createDelay) context.createDelay = context.createDelayNode;
if (!context.createScriptProcessor) context.createScriptProcessor = context.createJavaScriptNode;

// shim layer with setTimeout fallback
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame    ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

function playSound(arraybuffer) {
    context.decodeAudioData(arraybuffer, function (buf) {
        source = context.createBufferSource();
        source.connect(context.destination);
        source.buffer = buf;
        source.start(0);
        vs = new VisualizerSample(buf).togglePlayback();
    });
}

function playFile(file) {
    var freader = new FileReader();

    freader.onload = function (e) {
        console.log(e.target.result);
        playSound(e.target.result);
    };
    freader.readAsArrayBuffer(file);
}

var WIDTH = 640;
var HEIGHT = 360;

// Interesting parameters to tweak!
var SMOOTHING = 0.8;
var FFT_SIZE = 2048;

function VisualizerSample(buffer) {
	this.source = null;
	this.buffer = buffer;
	this.analyser = context.createAnalyser();

	this.analyser.connect(context.destination);
	this.analyser.minDecibels = -90;
	this.analyser.maxDecibels = 0;
	this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
	this.times = new Uint8Array(this.analyser.frequencyBinCount);

	this.isPlaying = false;
	this.startTime = 0;
	this.startOffset = 0;

	return this;
}

// Toggle playback
VisualizerSample.prototype.togglePlayback = function() {
	if (this.isPlaying) {
		// Stop playback
		this.source[this.source.stop ? 'stop': 'noteOff'](0);
		this.startOffset += context.currentTime - this.startTime;
		console.log('paused at', this.startOffset);
		// Save the position of the play head.
	} else {
		this.startTime = context.currentTime;
		console.log('started at', this.startOffset);
		this.source = context.createBufferSource();
		// Connect graph
		this.source.connect(this.analyser);
		this.source.buffer = this.buffer;
		this.source.loop = true;
		// Start playback, but make sure we stay in bound of the buffer.
		this.source[this.source.start ? 'start' : 'noteOn'](0, this.startOffset % this.buffer.duration);
		// Start visualizer.
		requestAnimFrame(this.draw.bind(this));
	}
	this.isPlaying = !this.isPlaying;

	return this;
};

VisualizerSample.prototype.updateAnalyzer = function (key, value) {
	this.analyser[key] = value;
	return this;
}

VisualizerSample.prototype.draw = function() {
	this.analyser.smoothingTimeConstant = SMOOTHING;
	this.analyser.fftSize = FFT_SIZE;
	// Get the frequency data from the currently playing music
	this.analyser.getByteFrequencyData(this.freqs);
	this.analyser.getByteTimeDomainData(this.times);
	
	var width = Math.floor(1/this.freqs.length, 10);
	
	var canvas = document.querySelector('canvas');
	var drawContext = canvas.getContext('2d');
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	// Draw the frequency domain chart.
	for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
		var value = this.freqs[i];
		var percent = value / 256;
		var height = HEIGHT * percent;
		var offset = HEIGHT - height - 1;
		var barWidth = WIDTH/this.analyser.frequencyBinCount;
		var hue = i/this.analyser.frequencyBinCount * 360;
		drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
		drawContext.fillRect(i * barWidth, offset, barWidth, height);
	};

	// Draw the time domain chart.
	for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
		var value = this.times[i];
		var percent = value / 256;
		var height = HEIGHT * percent;
		var offset = HEIGHT - height - 1;
		var barWidth = WIDTH/this.analyser.frequencyBinCount;
		drawContext.fillStyle = 'white';
		drawContext.fillRect(i * barWidth, offset, 1, 2);
	}

  if (this.isPlaying) {
    requestAnimFrame(this.draw.bind(this));
  }
};

VisualizerSample.prototype.getFrequencyValue = function(freq) {
  var nyquist = context.sampleRate/2;
  var index = Math.round(freq/nyquist * this.freqs.length);
  return this.freqs[index];
};

$(function () { 
	$('#audio').on('change', function (e) { 
		playFile(e.target.files[0]); 
	}); 

	$('#rangeMin').on('change', function (e) {
		vs.updateAnalyzer('minDecibels', e.target.value);
		$('#rangeMinView').text(e.target.value);
	})
	$('#rangeMax').on('change', function (e) {
		vs.updateAnalyzer('maxDecibels', e.target.value);
		$('#rangeMaxView').text(e.target.value);
	})
});