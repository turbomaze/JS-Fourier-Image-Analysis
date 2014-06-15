/******************\
|   Fourier Image  |
| @author Anthony  |
| @version 1.0.1   |
| @date 2014/06/14 |
| @edit 2014/06/15 |
\******************/

/**********
 * config */
var dims = [-1, -1]; //will be set later
var cc = 9e-3; //contrast constant

/*************
 * constants */

/*********************
 * working variables */
var canvases;
var ctxs;
var h;
var $h; //h hat
var h_; //h prime, the reconstructed h values

/******************
 * work functions */
function initFourierImage() {
    //event listeners
    function loadImage(loc) {
        var start = +new Date();

        //placed in a callback so the UI has a chance to update
        disableButtons(function() {
            //draw the initial image
            var img = new Image();
            img.addEventListener('load', function() {
                //make each canvas the image's exact size
                dims[0] = img.width;
                dims[1] = img.height;
                for (var ai = 0; ai < 4; ai++) {
                    canvases[ai] = $s('#canvas'+ai);
                    canvases[ai].width = dims[0], canvases[ai].height = dims[1];
                    ctxs[ai] = canvases[ai].getContext('2d');
                }

                //draw the image to the canvas
                ctxs[0].drawImage(img, 0, 0, img.width, img.height);

                //grab the pixels
                var imageData = ctxs[0].getImageData(0, 0, dims[0], dims[1]);
                var h_es = []; //the h values
                for (var ai = 0; ai < imageData.data.length; ai+=4) {
                    //greyscale, so you only need every 4th value
                    h_es.push(imageData.data[ai]);
                }

                //initialize the h values
                h = function(n, m) {
                    if (arguments.length === 0) return h_es;

                    var idx = n*dims[0] + m;
                    return h_es[idx];
                }; //create it in function form to make the code match the math

                enableButtons();

                var duration = +new Date() - start;
                console.log('It took '+duration+'ms to draw the image.');
            });
            img.crossOrigin = "anonymous";
            img.src = loc;
        });
    }
    $s('#draw-cs-btn').addEventListener('click', function() {
        loadImage('cs.png');
    });
    $s('#draw-circle-btn').addEventListener('click', function() {
        loadImage('circle.png');
    });
    $s('#draw-grace-btn').addEventListener('click', function() {
        loadImage('grace.png');
    });
    $s('#draw-img-btn').addEventListener('click', function() {
        loadImage($s('#img-url').value);
    });
    

    $s('#transform-btn').addEventListener('click', function() {
        var start = +new Date();

        if (!h()) return alert('You need to draw an image to canvas 1 first.');

        //placed in a callback so the UI has a chance to update
        disableButtons(function() {
            //compute the h hat values
            var h_hats = [];
            FFT(h_hats, h());
            h_hats = shiftFFT(h_hats);

            //get the largest magnitude
            var maxMagnitude = 0;
            for (var ai = 0; ai < h_hats.length; ai++) {
                var mag = h_hats[ai].magnitude();
                if (mag > maxMagnitude) {
                    maxMagnitude = mag;
                }
            }

            //apply a low or high pass filter
            var lpr = parseInt($s('#low-freq-radius').value); //low pass radius
            var hpr = parseInt($s('#high-freq-radius').value); //high " "
            var N = dims[1], M = dims[0];
            for (var k = 0; k < N; k++) {
                for (var l = 0; l < M; l++) {
                    var idx = k*M + l;
                    var dist = Math.pow(k-M/2, 2) + Math.pow(l-N/2, 2);
                    if (dist > lpr*lpr && isNaN(hpr) ||
                        dist < hpr*hpr && isNaN(lpr) ||
                        dist < lpr*lpr && !isNaN(lpr) && !isNaN(hpr) ||
                        dist > hpr*hpr && !isNaN(lpr) && !isNaN(hpr)) {
                        h_hats[idx] = new Complex(0, 0);
                    }
                }
            }

            //store them in a nice function to match the math
            $h = function(k, l) {
                if (arguments.length === 0) return h_hats;
 
                var idx = k*dims[0] + l;
                return h_hats[idx];
            };

            //draw the pixels
            var currImageData = ctxs[1].getImageData(0, 0, dims[0], dims[1]);
            var logOfMaxMag = Math.log(cc*maxMagnitude+1);
            for (var k = 0; k < dims[1]; k++) {
                for (var l = 0; l < dims[0]; l++) {
                    var idxInPixels = 4*(dims[0]*k + l);
                    currImageData.data[idxInPixels+3] = 255; //full alpha
                    var color = Math.log(cc*$h(k, l).magnitude()+1);
                        color = Math.round(255*(color/logOfMaxMag));
                    for (var c = 0; c < 3; c++) { //RGB are the same, lol c++
                        currImageData.data[idxInPixels+c] = color;
                    }
                }
            }
            ctxs[1].putImageData(currImageData, 0, 0);

            enableButtons();

            var duration = +new Date() - start;
            console.log('It took '+duration+'ms to compute the FT.');
        });
    });

    $s('#reconstruct-btn').addEventListener('click', function() {
        var start = +new Date();

        if (!$h()) {
            return alert('You first need to compute the Fourier transform.');
        }

        //placed in a callback so the UI has a chance to update
        disableButtons(function() {
            //compute the h prime values
            var h_primes = [];
            var h_hats = $h();
            h_hats = unshiftFFT(h_hats);
            invFFT(h_primes, h_hats);

            //store them in a nice function to match the math
            h_ = function(n, m) {
                if (arguments.length === 0) return h_primes;

                var idx = n*dims[0] + m;
                return round(h_primes[idx], 2);
            };

            //draw the pixels
            var currImageData = ctxs[2].getImageData(0, 0, dims[0], dims[1]);
            for (var n = 0; n < dims[1]; n++) {
                for (var m = 0; m < dims[0]; m++) {
                    var idxInPixels = 4*(dims[0]*n + m);
                    currImageData.data[idxInPixels+3] = 255; //full alpha
                    for (var c = 0; c < 3; c++) { //RGB are the same, lol c++
                        currImageData.data[idxInPixels+c] = h_(n, m);
                    }
                }
            }
            ctxs[2].putImageData(currImageData, 0, 0);

            enableButtons();

            var duration = +new Date() - start;
            console.log('It took '+duration+'ms to reconstruct the image.');
        });
    });

    $s('#difference-btn').addEventListener('click', function() {
        var start = +new Date();

        if (!h_()) {
            return alert('You haven\'t reconstructed an image yet.');
        }

        //placed in a callback so the UI has a chance to update
        disableButtons(function() {
            //find the range of the errors
            var minError = Infinity;
            var maxError = 0;
            for (var n = 0; n < dims[1]; n++) {
                for (var m = 0; m < dims[0]; m++) {
                    var error = h_(n, m) - h(n, m);
                    if (error < minError) minError = error;
                    if (error > maxError) maxError = error;
                }
            }

            //draw the pixels
            var currImageData = ctxs[3].getImageData(0, 0, dims[0], dims[1]);
            for (var n = 0; n < dims[1]; n++) {
                for (var m = 0; m < dims[0]; m++) {
                    var idxInPixels = 4*(dims[0]*n + m); //idx in the pixels array
                    var error = h_(n, m) - h(n, m);
                    var color = getCoolColor(error, [minError, maxError]);
                    for (var c = 0; c < 3; c++) {
                        currImageData.data[idxInPixels+c] = color[c];
                    }
                    currImageData.data[idxInPixels+3] = 255; // fullalpha		
                }
            }
            ctxs[3].putImageData(currImageData, 0, 0);

            enableButtons();

            var duration = +new Date() - start;
            console.log('It took '+duration+'ms to compute the difference.');
        });
    });

    //initialize the working variables
    canvases = [], ctxs = [];
    h = $h = h_ = function() { return false; };
}

function FFT(out, sig) {
    rec_FFT(out, 0, sig, 0, sig.length, 1);
}
function rec_FFT(out, start, sig, offset, N, s) {
    if (N === 1) {
        out[start] = new Complex(sig[offset], 0); //array
    } else {
        rec_FFT(out, start, sig, offset, N/2, 2*s);
        rec_FFT(out, start+N/2, sig, offset+s, N/2, 2*s);
        for (var k = 0; k < N/2; k++) {
            var twiddle = cisExp(-2*Math.PI*k/N);
            var t = out[start+k];
            out[start+k] = t.plus(twiddle.times(out[start+k+N/2]));
            out[start+k+N/2] = t.minus(twiddle.times(out[start+k+N/2]));
        }
    }
}

function invFFT(sig, transform) {
    rec_invFFT(sig, 0, transform, 0, transform.length, 1);
    for (var ai = 0; ai < sig.length; ai++) {
        sig[ai] = sig[ai].real/sig.length;
    }
}
function rec_invFFT(sig, start, transform, offset, N, s) {
    if (N === 1) {
        sig[start] = transform[offset];
    } else {
        rec_invFFT(sig, start, transform, offset, N/2, 2*s);
        rec_invFFT(sig, start+N/2, transform, offset+s, N/2, 2*s);
        for (var k = 0; k < N/2; k++) {
            var twiddle = cisExp(2*Math.PI*k/N);
            var t = sig[start+k];
            sig[start+k] = t.plus(twiddle.times(sig[start+k+N/2]));
            sig[start+k+N/2] = t.minus(twiddle.times(sig[start+k+N/2]));
        }
    }
}

function shiftFFT(transform) {
    return flipRightHalf(
        halfShiftFFT(
            halfShiftFFT(transform)
        )
    );
}
function unshiftFFT(transform) {
    return halfShiftFFT(
        halfShiftFFT(
            flipRightHalf(transform)
        )
    );
}
function halfShiftFFT(transform) {
    var ret = [];
    var N = dims[1];
    var M = dims[0];
    for (var n = 0, vOff = N/2; n < N; n++) {
        for (var m = 0; m < M/2; m++) {
            var idx = vOff*dims[0] + m;
            ret.push(transform[idx]);
        }
        vOff += vOff >= N/2 ? -N/2 : (N/2)+1;
    }
    for (var n = 0, vOff = N/2; n < N; n++) {
        for (var m = M/2; m < M; m++) {
            var idx = vOff*dims[0] + m;
            ret.push(transform[idx]);
        }
        vOff += vOff >= N/2 ? -N/2 : (N/2)+1;
    }
    return ret;
}
function flipRightHalf(transform) {
    var ret = [];

    //flip the right half of the image across the x axis
    var N = dims[1];
    var M = dims[0];
    for (var n = 0; n < N; n++) {
        for (var m = 0; m < M; m++) {
            var $n = m < M/2 ? n : (N-1)-n;
            var idx = $n*dims[0] + m;
            ret.push(transform[idx]);
        }
    }

    return ret;
}

/********************
 * helper functions */
function cisExp(x) { //e^ix = cos x + i*sin x
    return new Complex(Math.cos(x), Math.sin(x));
}

//returns array of pixel colors in the image
function getPixelsFromImage(location, callback) {
	var startedGettingPixels = new Date().getTime();
	var img = new Image(); //make a new image
	img.onload = function() { //when it is finished loading
		var canvas = document.createElement('canvas'); //make a canvas element
		canvas.width = img.width; //with this width
        //and this height (keep it the same as the image)
		canvas.height = img.height;
		canvas.style.display = 'none'; //hide it from the user
		document.body.appendChild(canvas); //then add it to the body
		var ctx = canvas.getContext('2d'); //now get the context
        //so that you can draw the image
		ctx.drawImage(img, 0, 0, img.width, img.height);
        //and grab its pixels
		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		document.body.removeChild(canvas); //all done, so get rid of it
		
		//...all so you can send the pixels, width, and the time taken to get
        //   them back through the callback
		var ret = [];
		for (var ai = 0; ai < imageData.data.length; ai++) {
            //annoying copy so the array can be edited
            ret.push(imageData.data[ai]);
        }
		callback(ret, img.width, new Date().getTime() - startedGettingPixels);
	};

	img.src = location; //load the image
}

function getCoolColor(n, range) {
    if (n === range[0] && range[0] === range[1]) {
        return getCoolColor(2*n, [n-1, 2*n+1]);
    }

	var raw = [1.0, 1.0, 1.0]; //white

	if (n < range[0]) n = range[0];
	if (n > range[1]) n = range[1];
	var dn = range[1] - range[0];

	if (n < (range[0] + 0.25 * dn)) {
		raw[0] = 0;
		raw[1] = 4 * (n - range[0]) / dn;
	} else if (n < (range[0] + 0.5 * dn)) {
		raw[0] = 0;
		raw[2] = 1 + 4 * (range[0] + 0.25 * dn - n) / dn;
	} else if (n < (range[0] + 0.75 * dn)) {
		raw[0] = 4 * (n - range[0] - 0.5 * dn) / dn;
		raw[2] = 0;
	} else {
		raw[1] = 1 + 4 * (range[0] + 0.75 * dn - n) / dn;
		raw[2] = 0;
	}
	
	var color = [
        tightMap(raw[0], 0, 1, 0, 255),
        tightMap(raw[1], 0, 1, 0, 255),
        tightMap(raw[2], 0, 1, 0, 255)
    ];
	return color;
}

function disableButtons(callback) {
    $s('#draw-cs-btn').disabled = true;
    $s('#draw-circle-btn').disabled = true;
    $s('#draw-grace-btn').disabled = true;
    $s('#draw-img-btn').disabled = true;
    $s('#transform-btn').disabled = true;
    $s('#reconstruct-btn').disabled = true;
    $s('#difference-btn').disabled = true;

    setTimeout(callback, 6); //6ms for the UI to update
}

function enableButtons() {
    $s('#draw-cs-btn').disabled = false;
    $s('#draw-circle-btn').disabled = false;
    $s('#draw-grace-btn').disabled = false;
    $s('#draw-img-btn').disabled = false;
    $s('#transform-btn').disabled = false;
    $s('#reconstruct-btn').disabled = false;
    $s('#difference-btn').disabled = false;
}

function $s(id) { //for convenience
    if (id.charAt(0) !== '#') return false;
    return document.getElementById(id.substring(1));
}

function getRandInt(low, high) { //output is in [low, high)
    return Math.floor(low + Math.random()*(high-low));
}

function round(n, places) {
    var mult = Math.pow(10, places);
    return Math.round(mult*n)/mult;
}

function tightMap(n, d1, d2, r1, r2) { //enforces boundaries
	var raw = map(n, d1, d2, r1, r2);
	if (raw < r1) return r1;
	else if (raw > r2) return r2;
	else return raw;
}

//given an n in [d1, d2], return a linearly related number in [r1, r2]
function map(n, d1, d2, r1, r2) {
	var Rd = d2-d1;
	var Rr = r2-r1;
	return (Rr/Rd)*(n - d1) + r1;
}

/***********
 * objects */
function Complex(re, im) {
    this.real = re;
    this.imag = im;
}
Complex.prototype.magnitude2 = function() {
    return this.real*this.real + this.imag*this.imag;
};
Complex.prototype.magnitude = function() {
    return Math.sqrt(this.magnitude2());
};
Complex.prototype.plus = function(z) {
    return new Complex(this.real+z.real, this.imag+z.imag);
};
Complex.prototype.minus = function(z) {
    return new Complex(this.real-z.real, this.imag-z.imag);
};
Complex.prototype.times = function(z) {
    if (typeof z === 'object') { //complex multiplication
        var rePart = this.real*z.real - this.imag*z.imag;
        var imPart = this.real*z.imag + this.imag*z.real;
        return new Complex(rePart, imPart);
    } else { //scalar multiplication
        return new Complex(z*this.real, z*this.imag);
    }
};

window.addEventListener('load', initFourierImage);












