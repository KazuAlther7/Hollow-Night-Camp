/* Corners Arcade: DnD Dice Tower (three.js + cannon-es). d20 is procedural so the top face can be read exactly. */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const $ = (id) => document.getElementById(id);
const stage = $('stage'), cv = $('cv'), resultEl = $('result');
const R = 0.36, rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- renderer / scene ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const k = Math.max(1, 1.3 / camera.aspect);
  camera.position.set(0, 7.4 * k, 11.2 * k);
  camera.lookAt(0, 1.4, 0.9);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
scene.add(new THREE.HemisphereLight(0xffe6c0, 0x203028, 1.3));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
sun.position.set(4, 10, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
scene.add(sun);
const fire = new THREE.PointLight(0xffa24a, 35, 14); fire.position.set(0, 3.5, 3); scene.add(fire);

/* ---------- physics ---------- */
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -22, 0) });
world.allowSleep = true;
world.defaultContactMaterial.friction = 0.32;
world.defaultContactMaterial.restitution = 0.3;
const floor = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(floor);

/* ---------- tower + tray (same list drives meshes and colliders) ---------- */
function brickTex(h, s, l, dark) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = dark; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) for (let x = -(r % 2) * 22; x < 256;) {
    const w = 40 + Math.random() * 50;
    g.fillStyle = `hsl(${h + rnd(-4, 4)} ${s}% ${l + rnd(-9, 9)}%)`; g.fillRect(x + 1.5, r * 32 + 1.5, w - 3, 29); x += w;
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const woodBase = brickTex(22, 45, 28, '#2a160c'), paleBase = brickTex(36, 50, 68, '#8a6a40');
function woodMat(base, s) {
  const t = base.clone(); t.needsUpdate = true; t.repeat.set(Math.max(s[0], s[2]) / 1.7, s[1] / 1.7);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
}
const felt = new THREE.MeshStandardMaterial({ color: 0x234a36, roughness: 1 });
const D = Math.PI / 180;
// [cx,cy,cz, sx,sy,sz, rotX, material(w|f|null=invisible), physics]
const parts = [
  [0, -0.1, 1.175, 9.4, 0.2, 8.65, 0, 'f', 0],
  [-4.7, 0.4, 1.175, 0.4, 0.8, 9.45, 0, 'w', 1], [4.7, 0.4, 1.175, 0.4, 0.8, 9.45, 0, 'w', 1],
  [0, 0.4, 5.7, 9.8, 0.8, 0.4, 0, 'w', 1], [0, 0.4, -3.35, 9.8, 0.8, 0.4, 0, 'w', 1],
  [-4.7, 4, 1.175, 0.4, 8, 9.45, 0, 0, 1], [4.7, 4, 1.175, 0.4, 8, 9.45, 0, 0, 1],
  [0, 4, 5.7, 9.8, 8, 0.4, 0, 0, 1], [0, 4, -3.35, 9.8, 8, 0.4, 0, 0, 1], [0, 8.2, 1.175, 9.8, 0.4, 9.45, 0, 0, 1],
  [0, 2.2, -2.875, 2.6, 4.4, 0.55, 0, 'w', 1],          // tower back
  [-1.025, 2.2, -1.575, 0.55, 4.4, 3.15, 0, 'w', 1],    // tower left
  [1.025, 2.2, -1.575, 0.55, 4.4, 3.15, 0, 'w', 1],     // tower right
  [0, 2.875, -0.3, 1.5, 3.05, 0.6, 0, 'w', 1],          // front lintel (arch opening below)
  [0, 3.22, -2.05, 1.5, 0.15, 1.15, 22 * D, 'w', 1],    // ramp A
  [0, 2.15, -1.15, 1.5, 0.15, 1.2, -22 * D, 'w', 1],    // ramp B
  [0, 0.47, -1.3, 1.5, 0.15, 2.75, 18 * D, 'w', 1],     // exit ramp C
  ...[[-1.05, -2.9], [1.05, -2.9], [-1.05, -0.25], [1.05, -0.25]].map(([x, z]) => [x, 4.625, z, 0.5, 0.45, 0.5, 0, 'w', 1]),
];
for (const [cx, cy, cz, sx, sy, sz, rx, m, ph] of parts) {
  if (m) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m === 'f' ? felt : woodMat(woodBase, [sx, sy, sz]));
    mesh.position.set(cx, cy, cz); mesh.rotation.x = rx; mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
  }
  if (ph) {
    const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2)) });
    b.position.set(cx, cy, cz); b.quaternion.setFromEuler(rx, 0, 0); world.addBody(b);
  }
}
const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x2b1b12, roughness: 0.9 }));
table.rotation.x = -Math.PI / 2; table.position.y = -0.21; table.receiveShadow = true; scene.add(table);
const paleMat = woodMat(paleBase, [1, 1, 1]);
const arch = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.1, 8, 24, Math.PI), paleMat); arch.position.set(0, 1.0, 0.03); scene.add(arch);
const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32), paleMat);
medal.rotation.x = Math.PI / 2; medal.position.set(0, 3.2, 0.03); scene.add(medal);

/* ---------- d20 ---------- */
const ico = new THREE.IcosahedronGeometry(R, 0);
const P = ico.attributes.position, faceN = [], num = new Array(20).fill(0);
for (let f = 0; f < 20; f++) {
  const [a, b, c] = [0, 1, 2].map((i) => new THREE.Vector3().fromBufferAttribute(P, f * 3 + i));
  faceN.push(b.clone().sub(a).cross(c.clone().sub(a)).normalize());
}
for (let k = 1, f = 0; f < 20; f++) if (!num[f]) { // opposite faces sum to 21
  let o = -1, best = 2; faceN.forEach((n, j) => { const d = n.dot(faceN[f]); if (j !== f && d < best) { best = d; o = j; } });
  num[f] = k; num[o] = 21 - k; k++;
}
const atlas = document.createElement('canvas'); atlas.width = 1020; atlas.height = 1024;
{
  const g = atlas.getContext('2d'); g.fillStyle = '#9f2626'; g.fillRect(0, 0, 1020, 1024);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (let f = 0; f < 20; f++) {
    const cx = (f % 5) * 204 + 102, cy = Math.floor(f / 5) * 256 + 128;
    g.fillStyle = '#d24444'; g.strokeStyle = '#1a0a0a'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx, cy - 110); g.lineTo(cx - 95, cy + 55); g.lineTo(cx + 95, cy + 55); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#140808'; g.font = '700 74px Arial'; g.fillText(String(num[f]), cx, cy + 6);
    if (num[f] === 6 || num[f] === 9) g.fillRect(cx - 18, cy + 40, 36, 6);
  }
}
const uv = new Float32Array(120);
for (let f = 0; f < 20; f++) {
  const cx = (f % 5) * 204 + 102, cy = Math.floor(f / 5) * 256 + 128;
  [[cx, cy - 110], [cx - 95, cy + 55], [cx + 95, cy + 55]].forEach(([x, y], i) => { uv[f * 6 + i * 2] = x / 1020; uv[f * 6 + i * 2 + 1] = 1 - y / 1024; });
}
ico.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
const atlasTex = new THREE.CanvasTexture(atlas); atlasTex.colorSpace = THREE.SRGBColorSpace; atlasTex.anisotropy = 4;
const diceMat = new THREE.MeshStandardMaterial({ map: atlasTex, roughness: 0.35, metalness: 0.1 });
const keyed = new Map(), cv3 = [], faces = [];
for (let i = 0; i < 60; i++) {
  const k = [P.getX(i), P.getY(i), P.getZ(i)].map((v) => v.toFixed(3)).join();
  if (!keyed.has(k)) { keyed.set(k, cv3.length); cv3.push(new CANNON.Vec3(P.getX(i), P.getY(i), P.getZ(i))); }
}
for (let f = 0; f < 20; f++) faces.push([0, 1, 2].map((i) => keyed.get([P.getX(f * 3 + i), P.getY(f * 3 + i), P.getZ(f * 3 + i)].map((v) => v.toFixed(3)).join())));
const diceShape = new CANNON.ConvexPolyhedron({ vertices: cv3, faces });

const dice = []; let timers = [], drag = null, pending = false, expected = 0, still = 0;
function addDie(pos, vel, spin) {
  const body = new CANNON.Body({ mass: 1, shape: diceShape, linearDamping: 0.1, angularDamping: 0.15, sleepSpeedLimit: 0.2, sleepTimeLimit: 0.5 });
  body.position.set(...pos); body.velocity.set(...vel); body.angularVelocity.set(...spin);
  body.quaternion.setFromEuler(rnd(0, 6), rnd(0, 6), rnd(0, 6));
  world.addBody(body);
  const mesh = new THREE.Mesh(ico, diceMat); mesh.castShadow = true; scene.add(mesh);
  dice.push({ body, mesh });
}
function clearDice() {
  timers.forEach(clearTimeout); timers = []; drag = null; pending = false;
  dice.splice(0).forEach((d) => { world.removeBody(d.body); scene.remove(d.mesh); });
}
let count = 1;
function launch(spawn) {
  clearDice(); expected = count; still = 0; pending = true; resultEl.className = 'arc-result'; resultEl.textContent = 'Rolling…';
  for (let i = 0; i < count; i++) timers.push(setTimeout(() => spawn(i), i * 260));
}
$('roll').onclick = () => launch((i) => addDie([rnd(-0.25, 0.25), 5.4 + i * 0.1, rnd(-2.2, -1)], [0, 0, 0], [rnd(-9, 9), rnd(-9, 9), rnd(-9, 9)]));
$('throw').onclick = () => launch((i) => addDie([rnd(2.5, 3.8), 1.4 + i * 0.5, 4.8], [-rnd(3, 7), rnd(2, 5), -rnd(7, 11)], [rnd(-15, 15), rnd(-15, 15), rnd(-15, 15)]));
$('clear').onclick = () => { clearDice(); resultEl.className = 'arc-result'; resultEl.textContent = 'Roll the dice…'; };
const setCount = (n) => { count = Math.max(1, Math.min(6, n)); $('count').textContent = count; };
$('minus').onclick = () => setCount(count - 1); $('plus').onclick = () => setCount(count + 1);

/* ---------- drag / throw dice with pointer ---------- */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), tmp = new THREE.Vector3();
function aim(e) { const r = cv.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); }
const pick = () => ray.intersectObjects(dice.map((d) => d.mesh))[0];
cv.addEventListener('pointerdown', (e) => {
  aim(e); const hit = pick(); if (!hit) return;
  const d = dice.find((x) => x.mesh === hit.object);
  drag = { d, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), hit.point), target: d.mesh.position.clone(), off: hit.point.clone().sub(d.mesh.position) };
  cv.setPointerCapture(e.pointerId); pending = false; resultEl.className = 'arc-result'; resultEl.textContent = 'Holding…';
});
cv.addEventListener('pointermove', (e) => {
  aim(e);
  if (!drag) { cv.style.cursor = pick() ? 'grab' : 'default'; return; }
  if (ray.ray.intersectPlane(drag.plane, tmp)) {
    drag.target.copy(tmp).sub(drag.off);
    drag.target.set(Math.max(-4.2, Math.min(4.2, drag.target.x)), Math.max(R + 0.05, Math.min(7.5, drag.target.y)), Math.max(-2.7, Math.min(5.1, drag.target.z)));
  }
});
const release = () => { if (!drag) return; drag = null; expected = dice.length; still = 0; pending = true; };
cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);

/* ---------- result ---------- */
const history = [];
function read(d) {
  const q = d.body.quaternion; let best = -2, f = 0;
  faceN.forEach((n, i) => { const y = q.vmult(new CANNON.Vec3(n.x, n.y, n.z)).y; if (y > best) { best = y; f = i; } });
  return { v: num[f], cocked: best < 0.9 };
}
function finish() {
  const r = dice.map(read), total = r.reduce((s, x) => s + x.v, 0), cocked = r.some((x) => x.cocked);
  const txt = r.length === 1 ? String(r[0].v) : `${r.map((x) => x.v).join(' + ')} = ${total}`;
  resultEl.textContent = cocked ? `${txt} (cocked die, roll again?)` : txt;
  resultEl.className = 'arc-result' + (r.length === 1 && !cocked ? (r[0].v === 20 ? ' is-nat20' : r[0].v === 1 ? ' is-nat1' : '') : '');
  history.unshift(txt); history.length = Math.min(history.length, 8);
  $('history').innerHTML = history.map((h) => `<li>${h}</li>`).join('');
}

/* ---------- loop ---------- */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (!stage.clientWidth) { last = now; return; }
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (drag) {
    const b = drag.d.body, v = new CANNON.Vec3(drag.target.x - b.position.x, drag.target.y - b.position.y, drag.target.z - b.position.z).scale(14);
    if (v.length() > 22) v.scale(22 / v.length(), v);
    b.wakeUp(); b.velocity.copy(v);
  }
  world.step(1 / 120, dt, 6);
  for (const d of dice) { d.mesh.position.copy(d.body.position); d.mesh.quaternion.copy(d.body.quaternion); }
  if (pending && !drag && dice.length && dice.length === expected) {
    const calm = dice.every((d) => d.body.sleepState === CANNON.Body.SLEEPING || (d.body.velocity.lengthSquared() < 0.02 && d.body.angularVelocity.lengthSquared() < 0.05));
    still = calm ? still + dt : 0;
    if (still > 0.6) { pending = false; finish(); }
  }
  renderer.render(scene, camera);
}
resize(); requestAnimationFrame(loop);
