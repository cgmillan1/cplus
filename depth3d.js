/* C Plus · 3D photos.
   Each project photo has a depth map (img/NAME-d.jpg) made with an AI depth model.
   This draws the photo in WebGL and moves a virtual camera, so near things shift more
   than far things: a still photo becomes a small 3D scene. */
(function () {
  const VS = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}`;
  const FS = `precision mediump float;varying vec2 v;uniform sampler2D img,dep;uniform vec2 cam,scale;uniform float zoom,amt;
  void main(){
    vec2 uv=(v-.5)*scale/zoom+.5;
    float d=texture2D(dep,uv).r;
    vec2 o=cam*(d-.45)*amt;
    /* 3 small steps so edges stretch smoothly instead of tearing */
    for(int i=0;i<3;i++){d=texture2D(dep,uv+o).r;o=cam*(d-.45)*amt;}
    vec2 q=clamp(uv+o,.001,.999);
    vec4 c=texture2D(img,q);
    float vig=smoothstep(1.15,.35,length(v-.5));
    gl_FragColor=vec4(c.rgb*(.82+.18*vig),1.);
  }`;
  const load = src => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function make(canvas, opts = {}) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return null;
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n);
    const u = { img: U('img'), dep: U('dep'), cam: U('cam'), scale: U('scale'), zoom: U('zoom'), amt: U('amt') };
    gl.uniform1i(u.img, 0); gl.uniform1i(u.dep, 1);
    const tex = [gl.createTexture(), gl.createTexture()];
    let iw = 1, ih = 1, ready = false, raf = 0, t0 = performance.now(), on = true, visible = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const amount = opts.amount ?? 0.05;

    function setTex(k, im) {
      gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, tex[k]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    }
    function size() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(2, Math.round(r.width * dpr)); canvas.height = Math.max(2, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      /* cover-fit: crop the photo to the canvas shape */
      const ca = canvas.width / canvas.height, ia = iw / ih;
      gl.uniform2f(u.scale, ca > ia ? 1 : ca / ia, ca > ia ? ia / ca : 1);
    }
    function frame(now) {
      raf = 0; if (!ready) return;
      const s = (now - t0) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
      /* slow orbit plus the pointer: like a camera dolly around the room */
      const ox = reduce || !on ? 0 : Math.sin(s * 0.45) * 0.9, oy = reduce || !on ? 0 : Math.cos(s * 0.32) * 0.45;
      gl.uniform2f(u.cam, ox + pointer.x * 1.4, oy + pointer.y * 0.9);
      gl.uniform1f(u.amt, on ? amount : 0);
      gl.uniform1f(u.zoom, 1.08 + (reduce || !on ? 0 : Math.sin(s * 0.2) * 0.04) + (opts.zoom || 0));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('resize', () => { if (ready) { size(); kick(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(canvas);
    const host = opts.pointerHost || canvas;
    host.addEventListener('pointermove', e => {
      const r = host.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; kick();
    });
    host.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = 0; });

    return {
      async show(name) {
        const [im, dp] = await Promise.all([load(`img/${name}.webp`), load(`img/${name}-d.jpg`)]);
        iw = im.naturalWidth; ih = im.naturalHeight; setTex(0, im); setTex(1, dp);
        ready = true; t0 = performance.now(); size(); canvas.classList.add('live'); kick();
      },
      set3D(v) { on = v; kick(); },
      get on() { return on; }
    };
  }
  window.Depth3D = { make };
})();
