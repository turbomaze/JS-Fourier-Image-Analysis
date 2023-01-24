/******************\
|   Fourier Image  |
| @author Anthony  |
| @version 1.1.2   |
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

  function FFT(sig, out) {
    if (sig.length === 0) {
      var e = new Error("Cannot transform an image with size of zero.");
      e.name = RangeError;
      e.givenLength = sig.length;
      throw e;
    }
    if (sig.length & (sig.length - 1)) {
      var e = new Error("Unimplemented: Only FFT of signals of length power of 2 supported by this implementation. Given: " + sig.length);
      e.name = RangeError;
      e.givenLength = sig.length;
      throw e;
    }
    rec_FFT_radix2(out, 0, sig, 0, sig.length, 1, 2);
  }

  function rec_FFT_radix2(out, start, sig, offset, N, s) {
    if (N === 1) {
      out[start] = new Complex(sig[offset], 0); // array
    } else {
      rec_FFT_radix2(out, start, sig, offset, N/2, 2*s);
      rec_FFT_radix2(out, start+N/2, sig, offset+s, N/2, 2*s);
      for (var k = 0; k < N/2; k++) {
        var twiddle = cisExp(-2*Math.PI*k/N);
        var factor = twiddle.times(out[start+k+N/2]);
        var t = out[start+k];
        out[start+k] = t.plus(factor);
        out[start+k+N/2] = t.minus(factor);
      }
    }
  }

  function invFFT(transform, sig) {
    if (transform.length === 0) {
      var e = new Error("Cannot transform an image with size of zero.");
      e.name = RangeError;
      e.givenLength = transform.length;
      throw e;
    }
    if (transform.length & (transform.length - 1)) {
      var e = new Error("Unimplemented: Only FFT of signals of length power of 2 supported by this implementation. Given: " + transform.length);
      e.name = RangeError;
      e.givenLength = transform.length;
      throw e;
    }
    rec_invFFT_radix2(sig, 0, transform, 0, transform.length, 1);
    for (var ai = 0; ai < sig.length; ai++) {
      sig[ai] = sig[ai].real/sig.length;
    }
  }

  function rec_invFFT_radix2(sig, start, transform, offset, N, s) {
    if (N === 1) {
      sig[start] = transform[offset];
    } else {
      rec_invFFT_radix2(sig, start, transform, offset, N/2, 2*s);
      rec_invFFT_radix2(sig, start+N/2, transform, offset+s, N/2, 2*s);
      for (var k = 0; k < N/2; k++) {
        var twiddle = cisExp(2*Math.PI*k/N);
        var factor = twiddle.times(sig[start+k+N/2]);
        var t = sig[start+k];
        sig[start+k] = t.plus(factor);
        sig[start+k+N/2] = t.minus(factor);
      }
    }
  }


  function shiftBottom(transform,dims){
    //shift bottom half one pixel to right
    var ret=[];
    var N = dims[1];
    var M = dims[0];

    for (var n=0;n<N;n++){
      for (var m=0;m<M;m++){

        if(m<M/2){
          var idx = n*N + m;
        } else { //shift bottom half one pixel to right
          var idx = n==N-1 ? m : (n+1)*N + m;
        }
        ret.push(transform[idx]);
      }
    }
    return ret;
  }

  function unshiftBottom(transform,dims){
    //shift bottom half one pixel to left
    var ret=[];
    var N = dims[1];
    var M = dims[0];

    for (var n=0;n<N;n++){
      for (var m=0;m<M;m++){
        if(m<M/2){
          var idx = n*N + m;
        } else { //shift bottom half one pixel to right
          if(n==0){
            var idx = (N-1)*N+m;
          } else {
            var idx = (n-1)*N +m;
          }
        }
        ret.push(transform[idx]);
      }
    }
    return ret;
  }
  
  function swapQuadrants(transform, dims) {
    //swap upper first and third quadrant and second and fourth

    var ret=[];
    var N = dims[1];
    var M = dims[0];

    for (var n=0;n<N;n++){
      var mrow=[];
      for (var m=0;m<M;m++){
        //map first quadrant to third quadrant
        if(m<M/2 && n>=N/2){
          var idx = (n-N/2)*dims[0] + M/2+m;
          mrow.push(transform[idx]);
        }
        //map second quadrant to fourth quadrant
        if(m<M/2 && n<N/2){
          var idx = (N/2+n)*dims[0] + M/2+m
        }
        //map third quadrant to first quadrant
        if(m>=M/2 && n<N/2){
          var idx = (N/2+n)*dims[0] + (m-N/2)
          mrow.push(transform[N/2+n][m-N/2]);
        }
        //map fourth quadrant to second quadrant
        if(m>=M/2 && n>=N/2){
          var idx = (n-N/2)*dims[0] + (m-N/2)
        }
        ret.push(transform[idx]);
      }
    }
    return ret;
  }

    function shiftFFT(transform, dims) {
    return shiftBottom(swapQuadrants(transform,dims),dims);
  }

  function unshiftFFT(transform, dims) {
    return swapQuadrants(unshiftBottom(transform,dims),dims);
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
    filter: filter,
  };
})();
