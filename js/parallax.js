// HOLLOW NIGHT CAMP — depth-map parallax (WebGL)
// Draws one image and shifts each pixel by its depth, so near objects
// move more than far ones. White = near, black = far in the depth map.
//
// const fx = createParallax(canvas, { image: '...jpg', depth: '...png' });
// fx.start();  fx.stop();

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uOffset;   // parallax shift, in uv units
uniform vec2 uScale;    // cover-fit + zoom

void main() {
  vec2 uv = (vUv - 0.5) * uScale + 0.5;

  // find which source pixel lands on this screen pixel
  vec2 p = uv;
  for (int i = 0; i < 4; i++) {
    float d = texture2D(uDepth, p).r;
    p = uv - uOffset * (d - 0.5);
  }

  gl_FragColor = vec4(texture2D(uImage, p).rgb, 1.0);
}`;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load: ' + src));
    img.src = src;
  });
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

export function createParallax(canvas, options) {
  const {
    image,
    depth,
    zoom = 1.08,        // enlarge so edges never show while shifting
    strength = 0.03,    // max shift (fraction of image width)
    sway = 1,           // idle motion when the pointer is still
    onStatus = () => {} // optional debug hook
  } = options;

  const noop = { supported: false, start() {}, stop() {} };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    || canvas.getContext('experimental-webgl');

  if (!gl) {
    onStatus('webgl: NOT available');
    return noop;
  }

  onStatus('webgl: ok');

  let program;

  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }
  } catch (error) {
    console.error('Parallax shader failed:', error);
    onStatus('shader error: ' + error.message);
    return noop;
  }

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uOffset = gl.getUniformLocation(program, 'uOffset');
  const uScale = gl.getUniformLocation(program, 'uScale');

  function makeTexture(unit, source, uniformName) {
    const texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, uniformName), unit);
  }

  let ready = false;
  let running = false;
  let frameId = 0;
  let imageAspect = 16 / 9;

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw(time) {
    resize();

    const t = time / 1000;
    const swayX = reduceMotion ? 0 : Math.sin(t * 0.35) * 0.35 * sway;
    const swayY = reduceMotion ? 0 : Math.cos(t * 0.27) * 0.2 * sway;

    current.x += (target.x + swayX - current.x) * 0.06;
    current.y += (target.y + swayY - current.y) * 0.06;

    const canvasAspect = canvas.width / canvas.height;
    let scaleX = 1;
    let scaleY = 1;

    if (canvasAspect > imageAspect) {
      scaleY = imageAspect / canvasAspect;
    } else {
      scaleX = canvasAspect / imageAspect;
    }

    gl.uniform2f(uScale, scaleX / zoom, scaleY / zoom);

    // mouse right -> near things shift left; mouse down -> near things shift up
    gl.uniform2f(uOffset, -current.x * strength, current.y * strength);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function loop(time) {
    if (!running) return;
    draw(time);
    frameId = requestAnimationFrame(loop);
  }

  function onPointer(event) {
    target.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1));
    target.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1));
  }

  function onTilt(event) {
    if (event.gamma == null || event.beta == null) return;
    target.x = Math.max(-1, Math.min(1, event.gamma / 25));
    target.y = Math.max(-1, Math.min(1, (event.beta - 45) / 25));
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    ready = false;
    canvas.classList.remove('ready'); // CSS background shows through
    onStatus('webgl context lost');
  });

  onStatus('loading ' + image);
  onStatus('loading ' + depth);

  Promise.all([loadImage(image), loadImage(depth)])
    .then(([img, dep]) => {
      onStatus('images loaded ' + img.naturalWidth + 'x' + img.naturalHeight + ' / ' + dep.naturalWidth + 'x' + dep.naturalHeight);
      imageAspect = img.naturalWidth / img.naturalHeight;

      makeTexture(0, img, 'uImage');
      makeTexture(1, dep, 'uDepth');

      ready = true;
      draw(0);
      canvas.classList.add('ready');
      onStatus('READY - parallax running');

      if (running && !reduceMotion) {
        frameId = requestAnimationFrame(loop);
      }
    })
    .catch((error) => {
      console.error('Parallax disabled:', error);
      onStatus('FAILED: ' + error.message);
    });

  return {
    supported: true,

    start() {
      if (running) return;
      running = true;

      if (!reduceMotion) {
        window.addEventListener('pointermove', onPointer, { passive: true });
        window.addEventListener('deviceorientation', onTilt, { passive: true });
      }

      if (ready && !reduceMotion) {
        frameId = requestAnimationFrame(loop);
      }
    },

    stop() {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
    }
  };
}
