// HOLLOW NIGHT CAMP — login / register page (index.html)

import {
  registerReader,
  loginReader,
  observeAuthState,
  getCurrentSession
} from './auth.js';

const ENTERED_KEY = 'hnc_entered';

const authForm = document.getElementById('authForm');

const usernameField = document.getElementById('usernameField');
const usernameInput = document.getElementById('username');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordHelp = document.getElementById('passwordHelp');

const submitButton = document.getElementById('submitButton');
const message = document.getElementById('message');

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');

const formHeading = document.getElementById('formHeading');
const formDescription = document.getElementById('formDescription');

let mode = 'login';
let busy = false;
let redirecting = false;

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = 'message visible';

  if (type) {
    message.classList.add(type);
  }
}

function clearMessage() {
  message.textContent = '';
  message.className = 'message';
}

function goHome({ fresh }) {
  if (redirecting) return;
  redirecting = true;

  // fresh login -> show the Welcome transition again
  if (fresh) {
    try {
      sessionStorage.removeItem(ENTERED_KEY);
    } catch (error) {}
  }

  window.location.replace('home.html');
}

function setMode(nextMode) {
  mode = nextMode;

  clearMessage();

  const isRegister = mode === 'register';

  loginTab.classList.toggle('active', !isRegister);
  registerTab.classList.toggle('active', isRegister);

  loginTab.setAttribute('aria-selected', String(!isRegister));
  registerTab.setAttribute('aria-selected', String(isRegister));

  usernameField.hidden = !isRegister;
  usernameInput.required = isRegister;

  passwordHelp.hidden = !isRegister;

  passwordInput.autocomplete = isRegister
    ? 'new-password'
    : 'current-password';

  formHeading.textContent = isRegister
    ? 'Join the camp!'
    : 'Hey, stranger!';

  formDescription.textContent = isRegister
    ? 'New around here? Pull up a chair.'
    : 'Got an account? Come on in.';

  submitButton.textContent = isRegister
    ? 'JOIN THE CAMP'
    : 'LET ME IN';
}

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (busy) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();

  if (mode === 'register') {
    if (username.length < 3) {
      showMessage('Your nickname needs at least 3 characters.', 'error');
      return;
    }

    if (password.length < 8) {
      showMessage('Your password needs at least 8 characters.', 'error');
      return;
    }
  }

  busy = true;

  submitButton.disabled = true;
  loginTab.disabled = true;
  registerTab.disabled = true;

  submitButton.textContent = 'HOLD ON A SEC...';

  clearMessage();

  try {
    if (mode === 'register') {
      const result = await registerReader(username, email, password);

      if (result.user && !result.session) {
        showMessage(
          'Your account has been created! Check your email and click the verification link before logging in.',
          'success'
        );
      } else if (result.session) {
        showMessage('Welcome to camp! Your account is ready.', 'success');
        goHome({ fresh: true });
      } else {
        showMessage(
          'Registration submitted. Check your email for the next step.',
          'success'
        );
      }

      authForm.reset();
    } else {
      const result = await loginReader(email, password);

      if (result.user) {
        goHome({ fresh: true });
      }
    }
  } catch (error) {
    showMessage(
      error.message || 'Something went wrong. Please try again.',
      'error'
    );
  } finally {
    busy = false;

    submitButton.disabled = false;
    loginTab.disabled = false;
    registerTab.disabled = false;

    submitButton.textContent = mode === 'register'
      ? 'JOIN THE CAMP'
      : 'LET ME IN';
  }
});

// Already signed in (or just verified by email link) -> go straight to camp
try {
  const session = await getCurrentSession();

  if (session?.user) {
    goHome({ fresh: false });
  }
} catch (error) {
  console.error('Unable to check session:', error);
}

try {
  observeAuthState((event, session) => {
    if (event === 'SIGNED_IN' && session?.user && !busy) {
      goHome({ fresh: false });
    }
  });
} catch (error) {
  console.error('Unable to initialize authentication state:', error);

  showMessage(
    'Unable to connect to the account service. Please refresh the page.',
    'error'
  );
}

if (new URLSearchParams(window.location.search).get('signedout')) {
  showMessage('You have signed out. The campfire will be waiting!', 'success');
}
