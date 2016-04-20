var floor = Math.floor;
function clamp(x, min, max) {
    if(x < min) return min;
    if(x > max) return max-1;
    return x;
}

function getDataFromImage(img) {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0 ,0);
    return ctx.getImageData(0, 0, img.width, img.height);
}

function loadImage(src, callback) {
    var img = document.createElement('img');
    img.crossOrigin = "Anonymous";
    img.onload = function(){callback(img);};
    img.src = src;
}

function disturb(x, y, z){
    if(x < 2 || x > width-2 || y < 1 || y > height-2)
        return;
    var i = x+y*width;
    buffer0[i] += z;
    buffer0[i-1] -= z;
}

function process() {
    var img = ctx.getImageData(0, 0, width, height),
        data = img.data,
        i, x;

    // average cells to make the surface more even
    for(i=width+1;i<size-width-1;i+=2) {
        for(x=1;x<width-1;x++,i++) {
            buffer0[i] = (buffer0[i]+buffer0[i+1]+buffer0[i-1]+buffer0[i-width]+buffer0[i+width])/5;
        }
    }

    for(i=width+1;i<size-width-1;i+=2) {
        for(x=1;x<width-1;x++,i++) {
            // wave propagation
            var velocity = -buffer1[i];
            var smoothed = (buffer0[i-1] + buffer0[i+1] + buffer0[i+width] + buffer0[i-width]) / 4;
            var waveHeight = smoothed * 2 + velocity;

            buffer1[i] = waveHeight;
            var damping = 1;

            var xoffset = floor((buffer1[i-2]-waveHeight)*damping);
            var yoffset = floor((buffer1[i-width]-waveHeight)*damping);

            // calculate index in the texture with some fake referaction
            var ti = i + xoffset + yoffset * width;
            // clamping
            ti = ti < 0 ? 0 : ti > size ? size : ti;
            // some very fake lighting and caustics based on the wave height
            // and angle
            var light = waveHeight*2.0-buffer1[i-2]*0.6,
                i4 = i*4,
                ti4 = ti*4;
            // clamping
            light = light < -10 ? -10 : light > 100 ? 100 : light;
            // light = 0;
            data[i4] = texture.data[ti4]+light;
            data[i4+1] = texture.data[ti4+1]+light;
            data[i4+2] = texture.data[ti4+2]+light;
        }
    }
    // rain
    // disturb(floor(Math.random()*width), floor(Math.random()*height), Math.random()*10000);
    aux = buffer0;
    buffer0 = buffer1;
    buffer1 = aux;
    ctx.putImageData(img, 0, 0);
}
var canvas = document.getElementById('c'),
    ctx = canvas.getContext('2d'),
    width = 200,
    height = 200,
    size = width*height,
    buffer0 = [],
    buffer1 = [],
    aux, i, texture;

for(i=0;i<size;i++){
    buffer0.push(0);
    buffer1.push(0);
}

// loadImage("https://29a.ch/sandbox/2010/water/background.jpg", function(img){
loadImage("https://pp.vk.me/c630829/v630829626/1d569/3PByHeejnh8.jpg", function(img){
    texture = getDataFromImage(img);
    canvas.width = width;
    canvas.height = height;
    ctx.fillRect(0, 0, width, height);
    setInterval(process, 1000/60);
    resizeBy(width-innerWidth, height-innerHeight);
});

// canvas.onmousemove = function(e){
canvas.onmousedown = function(e){
    disturb(
            floor(e.clientX/innerWidth*width),
            floor(e.clientY/innerHeight*height),
            15000);
}
