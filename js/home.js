// HOLLOW NIGHT CAMP — home.html: Welcome transition + Campfire home

import { updateReaderProfile } from './auth.js';
import { initPage, signOut, ENTERED_KEY } from './shared.js';
import { createParallax } from './parallax.js';

const welcomeScreen = document.getElementById('welcomeScreen');
const enterCampButton = document.getElementById('enterCampButton');
const campApp = document.getElementById('campApp');

const homeAuthorStudio = document.getElementById('homeAuthorStudio');
const authorHomeStatus = document.getElementById('authorHomeStatus');
const homeNickname = document.getElementById('homeNickname');
const homeLogoutButton = document.getElementById('homeLogoutButton');

const profileForm = document.getElementById('readerProfileEditor');
const profileNickname = document.getElementById('profileNickname');
const profileBio = document.getElementById('profileBio');
const profileRole = document.getElementById('profileRole');
const profileStatus = document.getElementById('profileStatus');
const profileSaveButton = document.getElementById('profileSaveButton');

const welcomeCanvas = document.getElementById('welcomeCanvas');
const welcomeSparks = document.getElementById('welcomeSparks');

// Welcome background: image + depth map -> parallax
const parallax = createParallax(welcomeCanvas, {
  image: 'assets/images/welcome-bg.jpg',
  depth: 'assets/images/welcome-depth.png'
});

// fireflies on top of the scene
for (let i = 0; i < 18; i++) {
  const spark = document.createElement('span');
  spark.className = 'w-spark';
  spark.style.left = (8 + Math.random() * 84) + '%';
  spark.style.top = (40 + Math.random() * 50) + '%';
  spark.style.setProperty('--dur', (7 + Math.random() * 8).toFixed(1) + 's');
  spark.style.setProperty('--delay', (-Math.random() * 12).toFixed(1) + 's');
  spark.style.setProperty('--dx', (Math.random() * 60 - 30).toFixed(0) + 'px');
  spark.style.setProperty('--dy', (-20 - Math.random() * 50).toFixed(0) + 'px');
  welcomeSparks.appendChild(spark);
}

let enterTimer = null;
let currentAvatarUrl = null;

// STAGES: welcome -> home
function setStage(next) {
  document.body.classList.remove('stage-welcome', 'stage-home');
  document.body.classList.add('stage-' + next);

  welcomeScreen.hidden = next !== 'welcome';
  campApp.hidden = next !== 'home';

  clearTimeout(enterTimer);
  enterCampButton.classList.remove('show');

  // only run the WebGL loop while the Welcome screen is visible
  if (next === 'welcome') {
    parallax.start();
  } else {
    parallax.stop();
  }

  if (next === 'welcome') {
    // the button appears 1 second after the transition screen opens
    enterTimer = setTimeout(() => {
      enterCampButton.classList.add('show');
      enterCampButton.focus({ preventScroll: true });
    }, 1000);
  }

  window.scrollTo(0, 0);
}

function toggleStudio(toggle, forceOpen) {
  const open = typeof forceOpen === 'boolean' ? forceOpen : homeAuthorStudio.hidden;

  homeAuthorStudio.hidden = !open;

  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open));
  }

  if (open) {
    homeAuthorStudio.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const ctx = await initPage({
  active: 'campfire',
  onAuthorToggle: (toggle) => toggleStudio(toggle)
});

const params = new URLSearchParams(window.location.search);
const wantsStudio = params.get('studio') === '1' && ctx.isAuthor;

let entered = false;

try {
  entered = sessionStorage.getItem(ENTERED_KEY) === '1';
} catch (error) {}

if (wantsStudio) entered = true;

setStage(entered ? 'home' : 'welcome');

enterCampButton.addEventListener('click', () => {
  try {
    sessionStorage.setItem(ENTERED_KEY, '1');
  } catch (error) {}

  setStage('home');
});

// PROFILE + ROLE
homeNickname.textContent = ctx.profile?.nickname || 'camper';

profileNickname.value = ctx.profile?.nickname || '';
profileBio.value = ctx.profile?.bio || '';
profileRole.textContent = (ctx.profile?.role || 'reader').toUpperCase();
currentAvatarUrl = ctx.profile?.avatar_url || null;

if (wantsStudio) {
  toggleStudio(document.getElementById('authorStudioToggle'), true);
}

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nickname = profileNickname.value.trim();
  const bio = profileBio.value.trim();

  if (nickname.length < 3) {
    profileStatus.textContent = 'Nickname must contain at least 3 characters.';
    return;
  }

  profileSaveButton.disabled = true;
  profileSaveButton.textContent = 'SAVING...';
  profileStatus.textContent = '';

  try {
    const updated = await updateReaderProfile(ctx.user.id, {
      nickname,
      bio,
      avatar_url: currentAvatarUrl
    });

    profileNickname.value = updated.nickname;
    profileBio.value = updated.bio;
    profileRole.textContent = updated.role.toUpperCase();
    homeNickname.textContent = updated.nickname;

    profileStatus.textContent = 'Profile saved successfully!';
  } catch (error) {
    console.error('Profile update failed:', error);
    profileStatus.textContent = error.message || 'Could not save your profile.';
  } finally {
    profileSaveButton.disabled = false;
    profileSaveButton.textContent = 'SAVE PROFILE';
  }
});

// AUTHOR STUDIO ACTIONS
document.querySelectorAll('[data-author-action]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!ctx.isAuthor) return;

    const action = button.dataset.authorAction;

    if (action === 'manage-novels') {
      window.location.href = 'novels.html';
      return;
    }

    const messages = {
      'new-novel': 'The Create New Novel feature is coming next.',
      'manage-chapters': 'Chapter management is coming next.',
      'world-building': 'World Building tools are coming next.'
    };

    authorHomeStatus.textContent = messages[action] || 'This feature is coming soon.';
    authorHomeStatus.hidden = false;
  });
});

// SIGN OUT
homeLogoutButton.addEventListener('click', async () => {
  homeLogoutButton.disabled = true;
  homeLogoutButton.textContent = 'HEADING OUT...';

  try {
    await signOut();
  } catch (error) {
    homeLogoutButton.disabled = false;
    homeLogoutButton.textContent = 'Sign out of camp';
    authorHomeStatus.textContent = error.message || 'Could not sign out. Please try again.';
    authorHomeStatus.hidden = false;
  }
});
