// The "control room" layer: boot log, clock, rotating word, console and friends.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = q => document.querySelector(q);

// boot screen: a short start-up log, shown once per visit
(function boot() {
  const box = $('.boot'), log = $('.boot-log'), pct = $('.boot-pct');
  let seen = false;
  try { seen = sessionStorage.getItem('booted') === '1'; sessionStorage.setItem('booted', '1'); } catch {}
  if (still || seen) return box.remove();
  const lines = ['loading agents', 'connecting to portals', 'reading 63,775 land rates', 'warming up the terrain', 'checking the inbox', 'all systems online'];
  let i = 0, n = 0;
  const t = setInterval(() => {
    n = Math.min(100, n + 3 + Math.random() * 7);
    pct.textContent = Math.floor(n) + '%';
    while (i < lines.length && n >= (i + 1) * 100 / lines.length) log.innerHTML += `<b>✓</b> ${lines[i++]}\n`;
    if (n >= 100) {
      clearInterval(t);
      setTimeout(() => box.classList.add('done'), 350);
      setTimeout(() => box.remove(), 1600);
    }
  }, 70);
})();

// live local time in Jaipur
(function clock() {
  const el = $('#clock');
  const tick = () => el.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
  tick(); setInterval(tick, 1000);
})();

// "Today it's portals / inboxes / ..."
(function rotate() {
  const el = $('.rot');
  if (!el || still) return;
  const words = el.dataset.words.split('|');
  let i = 0;
  setInterval(() => {
    el.classList.add('out');
    setTimeout(() => { el.textContent = words[i = (i + 1) % words.length]; el.classList.remove('out'); }, 300);
  }, 2200);
})();

// manifesto words light up as the paragraph moves up the screen
(function manifesto() {
  const p = $('[data-light]');
  const hot = /^(twice|rules|machine|without|guessing)/i;
  p.innerHTML = p.textContent.split(' ').map(w => `<span${hot.test(w) ? ' class="hot"' : ''}>${w}</span>`).join(' ');
  const words = [...p.children];
  const paint = () => {
    const r = p.getBoundingClientRect();
    const k = still ? 1 : Math.min(Math.max((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0), 1);
    words.forEach((w, i) => w.classList.toggle('lit', i < k * words.length));
  };
  addEventListener('scroll', paint, { passive: true });
  paint();
})();

// work index: a preview that floats with the pointer
(function peek() {
  const card = document.createElement('div'), img = document.createElement('img');
  card.className = 'peek'; img.alt = ''; card.append(img); document.body.append(card);
  document.querySelectorAll('.index a').forEach(a => {
    a.addEventListener('pointerenter', () => { img.src = a.dataset.img; card.classList.add('on'); });
    a.addEventListener('pointerleave', () => card.classList.remove('on'));
  });
  addEventListener('pointermove', e => { card.style.left = e.clientX + 'px'; card.style.top = e.clientY + 'px'; });
})();

// a cursor that says "View" over screenshots
(function cursor() {
  const c = $('.cursor');
  if (still || matchMedia('(hover: none)').matches) return c.remove();
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.toggle('big', !!e.target.closest('.zoom')); });
  (function follow() {
    cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
    c.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(follow);
  })();
})();

// the console: a few commands that talk about the work
(function terminal() {
  const out = $('.c-out'), form = $('.c-in'), input = $('#cmd');
  const say = html => { out.innerHTML += html + '\n'; out.scrollTop = out.scrollHeight; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const mail = 'shriyadav1500@gmail.com';
  const commands = {
    help: () => say([
      ['whoami', 'who is this'], ['projects', 'what I have built'], ['run runner', 'watch one case go through a portal'],
      ['agents', 'how I split work across agents'], ['stack', 'tools I use'], ['contact', 'how to reach me'], ['clear', 'wipe the screen'],
    ].map(([c, d]) => `<span class="k">${c.padEnd(11)}</span> ${d}`).join('\n')),
    whoami: () => say('Ram Yadav, Jaipur. I turn the steps people repeat every day into tools that do them.\nStarted in data entry in 2024. Building portal runners and agent workflows now.'),
    projects: () => say(['Portal Entry Runner', 'Agent workflow (965 records)', 'Land rate from a map pin', 'Portal auto-fill', 'Dashboard in sentences', 'Auctions on one map']
      .map((p, i) => `<span class="dim">0${i + 1}</span> ${p}`).join('\n')),
    stack: () => say([
      ['Python', 'Flask, SQLite, requests, openpyxl, PyMuPDF'], ['Web', 'JavaScript, Chrome extensions, Leaflet, Chart.js, Three.js'],
      ['Agents', 'briefs, packets, self-checks, API integration'], ['GIS', 'QGIS, ArcGIS, ArcGIS REST, KML'],
    ].map(([k, v]) => `<span class="g">${k.padEnd(7)}</span>${v}`).join('\n')),
    agents: () => say('1 brief -> 19 packets -> agents in parallel -> checks -> 1 sheet\nThe rule that matters most: <span class="p">if you can’t prove it, leave it blank and say why.</span>'),
    contact: () => say(`mail     <a href="mailto:${mail}">${mail}</a>\nlinkedin <a href="http://www.linkedin.com/in/yadav00ram">linkedin.com/in/yadav00ram</a>\ngithub   <a href="https://github.com/techshipz">github.com/techshipz</a>`),
    clear: () => { out.innerHTML = ''; },
    'run runner': async () => {
      for (const step of ['open', 'rework', 'pick', 'pin on map', 'upload', 'fill form', 'submit', 'send']) {
        say(`<span class="dim">[case 37120]</span> ${step.padEnd(11)} <span class="g">ok</span>`);
        await wait(420);
      }
      say('<span class="k">done.</span> 9 minutes on the real portal. Here it took 3 seconds.');
    },
    'sudo hire ram': () => say(`<span class="g">Permission granted.</span> Write to <a href="mailto:${mail}">${mail}</a> and tell me what your team repeats every day.`),
  };
  say('<span class="dim">Welcome. Type</span> <span class="k">help</span> <span class="dim">to see what this console can do.</span>');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const cmd = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
    input.value = '';
    if (!cmd) return;
    say(`<span class="p">&gt;</span> ${cmd.replace(/[<>&]/g, '')}`);
    const run = commands[cmd];
    run ? await run() : say('<span class="dim">Not a command yet. Try</span> <span class="k">help</span>');
  });
})();

// the services cube: spins on its own, can be dragged, and gets nudged when the pointer passes close by
(function cube() {
  const wrap = $('.cube-wrap'), el = $('.cube');
  if (!wrap || !el) return;
  const idle = 0.35;                       // degrees per frame when left alone
  let rx = -22, ry = 0, vx = 0, vy = idle, drag = null, last = null;

  wrap.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; wrap.setPointerCapture(e.pointerId); });
  addEventListener('pointerup', () => { drag = null; });

  addEventListener('pointermove', e => {
    const dx = last ? e.clientX - last.x : 0, dy = last ? e.clientY - last.y : 0;
    last = { x: e.clientX, y: e.clientY };
    if (drag) {                            // direct control while dragging
      vy = (e.clientX - drag.x) * 0.5; vx = -(e.clientY - drag.y) * 0.5;
      drag = { x: e.clientX, y: e.clientY };
      return;
    }
    const r = el.getBoundingClientRect();  // a push that fades with distance from the cube
    const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    const reach = r.width * 1.6;
    if (dist < reach) {
      const k = (1 - dist / reach) * 0.12;
      vy += dx * k; vx -= dy * k;
    }
  });

  (function frame() {
    if (!drag) {                           // ease back toward the calm spin and upright tilt
      vy += (idle - vy) * 0.03;
      vx += (-22 - rx) * 0.004 - vx * 0.05;
    }
    rx += vx; ry += vy;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    requestAnimationFrame(frame);
  })();
})();
