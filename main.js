import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- hero: contour terrain with agents moving across it ----------
function glow() {  // soft round sprite for the agent dots
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function terrain(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const world = new THREE.Group();
  scene.add(world);

  // a made-up landscape: a few overlapping waves are enough to read as hills
  const height = (x, z) => Math.sin(x * 0.45) * 0.7 + Math.cos(z * 0.6 + x * 0.25) * 0.55 + Math.sin((x + z) * 0.3) * 0.9;

  // colour follows height: blue pottery in the valleys, pink city on the slopes, saffron on the tops
  const ramp = ['#00BFB3', '#3D5AFE', '#7B3FF2', '#FF2E88', '#FF8A1F', '#FFBE0B'].map(c => new THREE.Color(c));
  const tint = y => {
    const t = Math.min(Math.max((y + 2.1) / 4.2, 0), 0.999) * (ramp.length - 1);
    return ramp[Math.floor(t)].clone().lerp(ramp[Math.floor(t) + 1], t % 1);
  };
  const strand = (pts, opacity) => {
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute('color', new THREE.Float32BufferAttribute(pts.flatMap(p => tint(p.y).toArray()), 3));
    world.add(new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity })));
  };
  for (let z = -9; z <= 9; z += 0.5) {           // contour rows
    const pts = [];
    for (let x = -12; x <= 12; x += 0.25) pts.push(new THREE.Vector3(x, height(x, z), z));
    strand(pts, 0.35 + (z + 9) / 18 * 0.6);
  }
  for (let x = -12; x <= 12; x += 1.5) {         // survey grid across them
    const pts = [];
    for (let z = -9; z <= 9; z += 0.25) pts.push(new THREE.Vector3(x, height(x, z), z));
    strand(pts, 0.22);
  }
  const plan = new THREE.Color('#FFBE0B');

  // agents: glowing points that travel along their own row and report back to a hub
  const hub = new THREE.Vector3(1, 3.6, -1);
  const agents = Array.from({ length: 11 }, (_, i) => ({ z: -7.5 + i * 1.5, speed: 0.6 + (i % 4) * 0.25, offset: i * 3.1 }));
  const dots = new THREE.BufferGeometry();
  dots.setAttribute('position', new THREE.BufferAttribute(new Float32Array(agents.length * 3 + 3), 3));
  world.add(new THREE.Points(dots, new THREE.PointsMaterial({ color: plan, size: 0.42, map: glow(), transparent: true, depthWrite: false })));
  const links = new THREE.BufferGeometry();
  links.setAttribute('position', new THREE.BufferAttribute(new Float32Array(agents.length * 6), 3));
  world.add(new THREE.LineSegments(links, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.18 })));

  camera.position.set(0, 5.2, 13);
  world.position.x = 4;
  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function frame(ms) {
    const t = ms / 1000;
    const p = dots.attributes.position.array, l = links.attributes.position.array;
    agents.forEach((a, i) => {
      const x = ((t * a.speed + a.offset) % 24) - 12;
      p.set([x, height(x, a.z) + 0.15, a.z], i * 3);
      l.set([x, height(x, a.z) + 0.15, a.z, hub.x, hub.y, hub.z], i * 6);
    });
    p.set([hub.x, hub.y, hub.z], agents.length * 3);
    dots.attributes.position.needsUpdate = links.attributes.position.needsUpdate = true;

    world.rotation.y = Math.sin(t * 0.08) * 0.18 + 0.35;
    camera.position.x += (mx * 3 - camera.position.x) * 0.04;
    camera.position.y += (5.2 - my * 2 - camera.position.y) * 0.04;
    camera.lookAt(2.5, 0.4, 0);
    renderer.render(scene, camera);
  }

  if (still) return frame(4000);
  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) requestAnimationFrame(loop); }).observe(canvas);
  function loop(ms) { if (!running) return; frame(ms); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
}
terrain(document.getElementById('terrain'));

// ---------- reveal on scroll, and screenshots settling flat ----------
const seen = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  seen.unobserve(e.target);
}), { threshold: 0.18 });
document.querySelectorAll('.reveal, .tilt').forEach(el => seen.observe(el));

// ---------- screenshots lean toward the pointer ----------
if (!still) document.querySelectorAll('.zoom').forEach(z => {
  z.addEventListener('pointermove', e => {
    const r = z.getBoundingClientRect();
    z.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg');
    z.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
  });
  z.addEventListener('pointerleave', () => { z.style.setProperty('--rx', '0deg'); z.style.setProperty('--ry', '0deg'); });
});

// ---------- numbers count up once ----------
const counter = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  counter.unobserve(e.target);
  const end = +e.target.dataset.count, t0 = performance.now();
  if (still) return;
  const tick = now => {
    const k = Math.min((now - t0) / 1400, 1);
    e.target.textContent = Math.round(end * (1 - (1 - k) ** 3)).toLocaleString('en-IN');
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));
document.querySelectorAll('[data-count]').forEach(el => counter.observe(el));

// ---------- click a screenshot to see it large ----------
const box = document.querySelector('.lightbox'), big = box.querySelector('img');
document.addEventListener('click', e => {
  const z = e.target.closest('.zoom');
  if (!z) return;
  const img = z.querySelector('img');
  big.src = img.src; big.alt = img.alt;
  box.showModal();
});
box.addEventListener('click', e => { if (e.target === box) box.close(); });
