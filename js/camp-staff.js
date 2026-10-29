// HOLLOW NIGHT CAMP — Camp Staff chat ("Stacy"), PRD §5.27. Looks like a camp service-desk chat.
// The browser only holds a short bounded history in localStorage; the Worker (worker/camp-staff) owns prompt, lore lookup and limits.
import { supabase } from '../config/supabase.js';
import { CAMP_STAFF_URL } from '../config/camp-staff.js';

const AVATAR = 'assets/staff/stacy-avatar.webp';
const KEY = 'hnc.campStaff.v1', SND = 'hnc.campStaff.sound';
const MAX_TURNS = 8, MAX_LEN = 500;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const QUICK = ['What is Hollow Night Camp?', 'How do I earn Amber Coin?', 'How does Daily Spin work?', 'Where should I start reading?'];
const GREETING = "Hi, I'm **Stacy**, Camp Staff here at Hollow Night Camp. 🔥 Ask me about the story, the camp, Amber Coin, ranks… anything. (Reader theories aren't canon, I'll tell you when something is just a theory.)";

let history = load(), busy = false, open = false, lastFailed = null;
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-MAX_TURNS * 2) : []; } catch { return []; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(history.slice(-MAX_TURNS * 2).map(({ role, content, sources }) => ({ role, content, sources })))); } catch { /* storage full/blocked */ } }
const soundOn = () => { try { return localStorage.getItem(SND) !== '0'; } catch { return true; } };

// tiny safe markdown: escape first, then **bold** and line breaks
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

/* ---------- feedback: soft ember crackle + tiny vibration (both optional, user-gesture only) ---------- */
let actx = null;
function feedback() {
  if (!soundOn()) return;
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)(); actx.resume?.();
    const len = actx.sampleRate * 0.35, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() < 0.012 ? (Math.random() * 2 - 1) : 0) * (1 - i / len) + (Math.random() * 2 - 1) * 0.02 * (1 - i / len);
    const src = actx.createBufferSource(), g = actx.createGain(); g.gain.value = 0.35; src.buffer = buf; src.connect(g).connect(actx.destination); src.start();
  } catch { /* sound is optional */ }
  try { if (!reduceMotion) navigator.vibrate?.(15); } catch { /* unsupported */ }
}

/* ---------- UI ---------- */
let root, panel, list, input, sendBtn, count, live, typingEl;
function build() {
  root = document.createElement('div'); root.className = 'cs-root';
  root.innerHTML = `
    <button class="cs-launch" type="button" aria-label="Chat with Camp Staff" aria-expanded="false" aria-controls="csPanel">
      <img src="${AVATAR}" alt="" draggable="false"><span class="cs-dot" aria-hidden="true"></span><span class="cs-launch-tip">Need help? Ask Stacy</span>
    </button>
    <section class="cs-panel" id="csPanel" role="dialog" aria-label="Camp Staff chat" hidden>
      <header class="cs-head">
        <img src="${AVATAR}" alt="" draggable="false">
        <div><strong>Stacy</strong><small><i class="cs-dot"></i> Camp Staff · Service Desk</small></div>
        <button class="cs-icon cs-snd" type="button" aria-label="Sound and vibration" aria-pressed="true" title="Sound">♪</button>
        <button class="cs-icon cs-clear" type="button" aria-label="Clear chat" title="Clear chat">↺</button>
        <button class="cs-icon cs-close" type="button" aria-label="Close chat">×</button>
      </header>
      <div class="cs-list" id="csList" tabindex="0"></div>
      <div class="cs-live" aria-live="polite" aria-atomic="true"></div>
      <footer class="cs-foot">
        <div class="cs-row"><textarea rows="1" maxlength="${MAX_LEN}" placeholder="Write to Camp Staff…" aria-label="Message to Camp Staff"></textarea><button class="cs-send" type="button" aria-label="Send" disabled>➤</button></div>
        <small><span class="cs-count">0/${MAX_LEN}</span> · Stacy is an AI. Not canon unless it says so.</small>
      </footer>
    </section>`;
  document.body.append(root);
  panel = root.querySelector('.cs-panel'); list = root.querySelector('.cs-list'); input = root.querySelector('textarea');
  sendBtn = root.querySelector('.cs-send'); count = root.querySelector('.cs-count'); live = root.querySelector('.cs-live');
  const launch = root.querySelector('.cs-launch'), snd = root.querySelector('.cs-snd');
  const sync = () => { snd.setAttribute('aria-pressed', String(soundOn())); snd.classList.toggle('is-off', !soundOn()); snd.title = soundOn() ? 'Sound on' : 'Sound off'; }; sync();
  launch.addEventListener('click', () => toggle(true));
  root.querySelector('.cs-close').addEventListener('click', () => toggle(false));
  root.querySelector('.cs-clear').addEventListener('click', clearChat);
  snd.addEventListener('click', () => { try { localStorage.setItem(SND, soundOn() ? '0' : '1'); } catch { /* ignore */ } sync(); });
  input.addEventListener('input', () => { count.textContent = `${input.value.length}/${MAX_LEN}`; sendBtn.disabled = busy || !input.value.trim(); input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 96) + 'px'; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  sendBtn.addEventListener('click', () => send());
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  render();
}
function toggle(v) {
  open = v; panel.hidden = !v; root.classList.toggle('is-open', v);
  root.querySelector('.cs-launch').setAttribute('aria-expanded', String(v));
  if (v) { list.scrollTop = list.scrollHeight; setTimeout(() => input.focus(), 50); } else root.querySelector('.cs-launch').focus();
}
function bubble(m) {
  const row = document.createElement('div'); row.className = `cs-msg cs-${m.role === 'user' ? 'me' : 'staff'}`;
  const inner = m.role === 'user' ? '' : `<img src="${AVATAR}" alt="" draggable="false">`;
  const src = (m.sources || []).map((s) => `<a href="${esc(s.url)}">${esc(s.title)}</a>`).join('');
  row.innerHTML = `${inner}<div class="cs-bub"><div>${md(m.content)}</div>${src ? `<nav class="cs-src" aria-label="Sources">${src}</nav>` : ''}</div>`;
  return row;
}
function render() {
  list.innerHTML = '<div class="cs-day">Today</div>';
  list.append(bubble({ role: 'assistant', content: GREETING }));
  if (!history.length) {
    const chips = document.createElement('div'); chips.className = 'cs-chips';
    QUICK.forEach((q) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = q; b.addEventListener('click', () => send(q)); chips.append(b); });
    list.append(chips);
  }
  history.forEach((m) => list.append(bubble(m)));
  list.scrollTop = list.scrollHeight;
}
function scroll() { list.scrollTo({ top: list.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); }
function typing(on) {
  typingEl?.remove(); typingEl = null; if (!on) return;
  typingEl = document.createElement('div'); typingEl.className = 'cs-msg cs-staff cs-typing';
  typingEl.innerHTML = `<img src="${AVATAR}" alt=""><div class="cs-bub" role="status" aria-label="Stacy is typing"><i></i><i></i><i></i></div>`;
  list.append(typingEl); scroll();
}
function note(text, retry) {
  const n = document.createElement('div'); n.className = 'cs-note'; n.setAttribute('role', 'alert'); n.textContent = text;
  if (retry) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Try again'; b.addEventListener('click', () => { n.remove(); send(retry, true); }); n.append(b); }
  list.append(n); scroll();
}
function clearChat() {
  if (busy) return; history = []; lastFailed = null; try { localStorage.removeItem(KEY); } catch { /* ignore */ } render(); input.focus();
}

/* ---------- send ---------- */
const ERR = {
  auth: 'Your session expired. Please sign in again.',
  rate_limit: "You're sending messages fast, let the fire settle for a minute. 🔥",
  quota: "The campfire's resting for today (free daily limit reached). Please come back later.",
  timeout: 'That took too long. Want to try again?',
};
async function send(text, isRetry = false) {
  text = (text ?? input.value).trim().slice(0, MAX_LEN); if (!text || busy) return;
  list.querySelector('.cs-chips')?.remove();
  if (!isRetry) { history.push({ role: 'user', content: text }); list.append(bubble({ role: 'user', content: text })); save(); }
  input.value = ''; input.style.height = 'auto'; count.textContent = `0/${MAX_LEN}`;
  busy = true; sendBtn.disabled = true; typing(true);
  try {
    if (!CAMP_STAFF_URL) throw Object.assign(new Error('offline'), { code: 'offline' });
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw Object.assign(new Error('auth'), { code: 'auth' });
    const res = await fetch(CAMP_STAFF_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ messages: history.slice(-MAX_TURNS * 2).map(({ role, content }) => ({ role, content })), page: location.pathname.split('/').pop() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.reply) throw Object.assign(new Error(data.error || 'server'), { code: data.error || 'server' });
    const m = { role: 'assistant', content: String(data.reply), sources: Array.isArray(data.sources) ? data.sources.slice(0, 4) : [] };
    history.push(m); save(); typing(false); list.append(bubble(m)); scroll(); live.textContent = `Stacy: ${m.content}`; feedback();
  } catch (err) {
    typing(false); lastFailed = text;
    const code = err.code || 'network';
    note(code === 'offline' ? 'Camp Staff is not connected yet. Try the Novels or World Building pages in the meantime.' : ERR[code] || "I couldn't reach the camp office. Check your connection and try again.", code === 'auth' || code === 'offline' || code === 'quota' ? null : text);
  } finally { busy = false; sendBtn.disabled = !input.value.trim(); }
}

export async function mountCampStaff() {
  if (document.querySelector('.cs-root')) return;
  try { const { data: { session } } = await supabase.auth.getSession(); if (!session) return; } catch { return; }
  if (!document.querySelector('link[data-cs-css]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/camp-staff.css?v=1'; l.dataset.csCss = ''; document.head.append(l); }
  build();
}
