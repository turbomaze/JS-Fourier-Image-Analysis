JS-Fourier-Image-Analysis
=========================

This is a web app that computes the 2D Fourier transforms (FTs) of images. After a FT is computed, an image is generated representing the magnitudes of each of the constituent sinusoids.

Low frequencies are in the center of this image, per usual. Entering a value in the "Low pass radius" box removes all sinusoids that are more than that many pixels away from the center: those with high frequency. Setting the "High pass radius" removes the sinusoids that are within the specified number of pixels. If you enter both a low and high pass radius, a band filter will be applied. That is, only sinusoids between the low and high radii are kept.

Once you click the reconstruct button to restore the image, you can see how the result differs from the original. Green areas are the same as the original, blue areas are darker, and red areas are brighter. Currently (due to CORS issues), only images that are hosted on the same web server as the web app can be transformed.

Check out a live demo at: http://turbomaze.github.io/JS-Fourier-Image-Analysis/