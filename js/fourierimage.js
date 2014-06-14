/******************\
|   Fourier Image  |
| @author Anthony  |
| @version 0.1     |
| @date 2014/06/14 |
| @edit 2014/06/14 |
\******************/

/**********
 * config */
var dims = [250, 250];
var imageLoc = 'image.png';

/*************
 * constants */

/*********************
 * working variables */
var canvases;
var ctxs;

/******************
 * work functions */
function initFourierImage() {
    //event listeners
    $s('#draw-btn').addEventListener('click', function() {
        //draw the initial image
        var img = new Image();
        img.addEventListener('load', function() {
            ctxs[0].drawImage(img, 0, 0, img.width, img.height);
        });
        img.src = imageLoc;
    });

    $s('#transform-btn').addEventListener('click', function() {
        //here
    });

    $s('#reconstruct-btn').addEventListener('click', function() {
        //here
    });

    //initialize the working variables
    canvases = [], ctxs = [];
    for (var ai = 0; ai < 3; ai++) {
        canvases[ai] = $s('#canvas'+ai);
        canvases[ai].width = dims[0], canvases[ai].height = dims[1];
        ctxs[ai] = canvases[ai].getContext('2d');
    }
}

/********************
 * helper functions */
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

/***********
 * objects */

window.addEventListener('load', initFourierImage);