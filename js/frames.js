// HOLLOW NIGHT CAMP — Profile frame skins (server side: sql/frames.sql). null / error message when the SQL has not been run.
import { supabase } from '../config/supabase.js';

// The frame worn on the Camp Profile card: { key, title, asset_path } or null.
export async function getEquippedFrame() {
  const { data, error } = await supabase.from('user_profile_frame')
    .select('frame_key, collectible_definitions(key, title, description, asset_path)').maybeSingle();
  const d = !error && data?.collectible_definitions;
  return d ? { key: d.key, title: d.title, asset_path: d.asset_path, rarity: frameRarity(d.description) } : null;
}

// key = null takes the frame off. Returns an error message, or null on success.
export async function setProfileFrame(key) {
  const { error } = await supabase.rpc('set_profile_frame', { p_key: key });
  if (!error) return null;
  return error.message?.includes('not_owned') ? 'You do not own this frame.' : 'Could not save the frame. Try again.';
}

// Rarity lives in the collectible description ("Legendary frame skin. ..."), written by sql/shop.sql.
export function frameRarity(description) {
  return ((description || '').match(/^(\w+) frame skin/i)?.[1] || '').toLowerCase();
}

let fxCss = null;
export function ensureFrameStyles() {
  if (fxCss) return fxCss;
  fxCss = new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'css/frames.css?v=1';
    link.addEventListener('load', resolve); link.addEventListener('error', resolve);
    document.head.append(link);
  });
  return fxCss;
}

// A frame skin as DOM: <span class="frame-fx"> (rarity effects such as the Legendary shimmer live in css/frames.css).
export function frameEl(frame, cls = '') {
  ensureFrameStyles();
  const wrap = document.createElement('span');
  wrap.className = 'frame-fx ' + cls; wrap.dataset.r = frame.rarity || '';
  wrap.style.setProperty('--frame', 'url("' + frame.asset_path + '")');
  wrap.setAttribute('aria-hidden', 'true');
  const im = new Image(); im.src = frame.asset_path; im.alt = ''; im.draggable = false;
  wrap.append(im);
  return wrap;
}
