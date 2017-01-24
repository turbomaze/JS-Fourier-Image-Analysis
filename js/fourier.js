/******************\
|   Fourier Image  |
| @author Anthony  |
| @version 1.0.2   |
| @date 2014/06/14 |
| @edit 2017/01/23 |
\******************/

var Fourier = (function() {
  /******************
   * work functions */
  function filter(data, dims, lowPass, highPass) {
    var lowPassSq = Math.pow(lowPass, 2);
    var highPassSq = Math.pow(highPass, 2);
    var N = dims[1];
    var M = dims[0];
    for (var k = 0; k < N; k++) {
      for (var l = 0; l < M; l++) {
        var idx = k*M + l;
        var d = Math.pow(k-M/2, 2) + Math.pow(l-N/2, 2);
        if (
          d > lowPassSq && isNaN(highPass) ||
          d < highPassSq && isNaN(lowPass) ||
          d < lowPassSq && !isNaN(lowPass) && !isNaN(highPass) ||
          d > highPassSq && !isNaN(lowPass) && !isNaN(highPass)
        ) {
          data[idx] = new Fourier.Complex(0, 0);
        }
      }
    }
  }

  function FFT(out, sig) {
    rec_FFT(out, 0, sig, 0, sig.length, 1);
  }

  function rec_FFT(out, start, sig, offset, N, s) {
    if (N === 1) {
      out[start] = new Complex(sig[offset], 0); // array
    } else {
      rec_FFT(out, start, sig, offset, N/2, 2*s);
      rec_FFT(out, start+N/2, sig, offset+s, N/2, 2*s);
      for (var k = 0; k < N/2; k++) {
        var twiddle = cisExp(-2*Math.PI*k/N);
        var t = out[start+k];
        out[start+k] = t.plus(twiddle.times(out[start+k+N/2]));
        out[start+k+N/2] = t.minus(
          twiddle.times(out[start+k+N/2])
        );
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
        sig[start+k+N/2] = t.minus(
          twiddle.times(sig[start+k+N/2])
        );
      }
    }
  }
  
  function shiftFFT(transform, dims) {
    return flipRightHalf(
      halfShiftFFT(
        halfShiftFFT(
          transform,
          dims
        ),
        dims
      ),
      dims
    );
  }

  function unshiftFFT(transform, dims) {
    return halfShiftFFT(
      halfShiftFFT(
        flipRightHalf(
          transform,
          dims
        ),
        dims
      ),
      dims
    );
  }

  function halfShiftFFT(transform, dims) {
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

  function flipRightHalf(transform, dims) {
    var ret = [];
  
    // flip the right half of the image across the x axis
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
  function cisExp(x) { // e^ix = cos x + i*sin x
    return new Complex(Math.cos(x), Math.sin(x));
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
    if (typeof z === 'object') { // complex multiplication
      var rePart = this.real*z.real - this.imag*z.imag;
      var imPart = this.real*z.imag + this.imag*z.real;
      return new Complex(rePart, imPart);
    } else { // scalar multiplication
      return new Complex(z*this.real, z*this.imag);
    }
  };
  
  return {
    Complex: Complex,
    transform: FFT,
    invert: invFFT,
    shift: shiftFFT,
    unshift: unshiftFFT,
    filter: filter
  };
})();
