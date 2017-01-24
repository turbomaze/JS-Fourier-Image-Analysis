JS Fourier Image Analysis
==

This is a web app that computes the 2D Fourier transforms (FTs) of images. After a FT is computed, an image is generated representing the magnitudes of each of the constituent sinusoids.

Check out a live demo at: http://turbomaze.github.io/JS-Fourier-Image-Analysis/

Low frequencies are in the center of this image, per usual. Entering a value in the "Low pass radius" box removes all sinusoids that are more than that many pixels away from the center: those with high frequency. Setting the "High pass radius" removes the sinusoids that are within the specified number of pixels. If you enter both a low and high pass radius, a band filter will be applied. That is, only sinusoids between the low and high radii are kept.

Once you click the reconstruct button to restore the image, you can see how the result differs from the original. Green areas are the same as the original, blue areas are darker, and red areas are brighter. Currently (due to CORS issues), only images that are hosted on the same web server as the web app can be transformed.

For more info about Fourier transforms/an example app that uses this code, check out [this blog post about evolutionary art](https://igliu.com/fourier-transform-for-evolutionary-art/).

## Usage
To use this module, include the `js/fourier.js` file in your webpage.

To compute the FFT of an input array, call the `Fourier.transform(data, out)` function where `data` is the array of vaalues you'd like to FFT and `out` is an empty, pre-declared array that will be filled with the transform.

For the inverse FFT, use `Fourier.invert(transform, sig)` similarly.

To compute the FFT of an image, first, draw it to a canvas and get the image data with `[CanvasRenderingContext2D].getImageData`. Then you can run the above functions on a copy of the resulting array. See the demo code in `js/main.js` for examples.

You can compute ta low pass/high pass filter with the `Fourier.filter(data, dims, lowPass, highPass)` function. `data` is the FFT output, `dims` is a two-element array representing the dimensions of the original image, `lowPass` is the optional low pass radius and `highPass` is the optional high pass radius.

## License
MIT License: http://igliu.mit-license.org/
