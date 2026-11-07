// Firebase sign-in (Google or email and password) plus the Valus API. The Firebase web config comes from GET /api/config,
// so nothing project-specific is committed to the static site.
const SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';

export const session = {
  ready: false,       // first auth check finished
  unavailable: '',    // sign-in cannot start (missing config, offline)
  user: null,         // Firebase user
  profile: null,      // Valus profile once enrolled
  enrolled: false,
  error: '',
  communities: [],
};

let fb = null;
// While an account is being created, createAccount settles the session itself.
let creating = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());
export const onSession = (fn) => listeners.add(fn);

export async function api(method, path, body) {
  const token = await session.user?.getIdToken();
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers: { ...(token && { Authorization: 'Bearer ' + token }), ...(body && { 'Content-Type': 'application/json' }) },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error('Valus could not be reached. Check your connection and try again.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Valus is temporarily unavailable. Please try again.'), { status: res.status });
  return data;
}

async function loadProfile() {
  session.error = '';
  try {
    const me = await api('GET', '/me');
    session.enrolled = me.enrolled;
    session.profile = me.profile;
  } catch (error) {
    session.enrolled = false;
    session.profile = null;
    session.error = error.message;
  }
}

export async function startSession() {
  try {
    const config = await api('GET', '/config');
    session.communities = config.communities ?? [];
    if (!config.firebase?.apiKey || !config.firebase?.authDomain) throw new Error('Sign-in is not configured yet.');
    const [{ initializeApp }, auth] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js')]);
    const app = initializeApp(config.firebase);
    fb = { ...auth, app, auth: auth.getAuth(app) };
  } catch (error) {
    session.unavailable = error.message || 'Sign-in is unavailable right now.';
    session.ready = true;
    return notify();
  }
  fb.onAuthStateChanged(fb.auth, async (user) => {
    if (creating) return;
    // Nothing changed (for example a failed sign-up that was already rolled back).
    if (session.ready && (user?.uid ?? null) === (session.user?.uid ?? null)) return;
    session.user = user;
    session.profile = null;
    session.enrolled = false;
    if (user) await loadProfile();
    session.ready = true;
    notify();
  });
}

const AUTH_ERRORS = {
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for Valus and try again.',
  'auth/unauthorized-domain': 'Google sign-in is not enabled for this address yet.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for Valus yet.',
  'auth/network-request-failed': 'Valus could not reach the sign-in service. Check your connection and try again.',
  'auth/account-exists-with-different-credential': 'This email already uses a different sign-in method.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account already uses this email. Sign in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Choose a password with at least 8 characters.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'That email and password do not match an account.',
  'auth/wrong-password': 'That email and password do not match an account.',
  'auth/user-not-found': 'That email and password do not match an account.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
};
const authFailure = (error, fallback) => new Error(AUTH_ERRORS[error?.code] || fallback);
const closedPopup = (error) => error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request';

function ready() {
  if (!fb) throw new Error(session.unavailable || 'Sign-in is still loading.');
}

function googlePopup() {
  const provider = new fb.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return fb.signInWithPopup(fb.auth, provider);
}

// Resolves false when the person closes the Google window themselves.
export async function googleSignIn() {
  ready();
  try {
    await googlePopup();
    return true;
  } catch (error) {
    if (closedPopup(error)) return false;
    throw authFailure(error, 'Google sign-in did not finish. Please try again.');
  }
}

export async function emailSignIn(email, password) {
  ready();
  try {
    await fb.signInWithEmailAndPassword(fb.auth, email.trim(), password);
  } catch (error) {
    throw authFailure(error, 'Sign-in did not finish. Please try again.');
  }
}

export async function resetPassword(email) {
  ready();
  try {
    await fb.sendPasswordResetEmail(fb.auth, email.trim());
  } catch (error) {
    // Unknown emails are not reported, so this cannot be used to find out who has an account.
    if (error?.code !== 'auth/user-not-found') throw authFailure(error, 'The reset email could not be sent. Please try again.');
  }
}

// Creates the sign-in account and joins the school community in one step. If the community
// password is wrong, a brand-new account is removed again so nothing is left half made.
// Resolves false when the person closes the Google window themselves.
export async function createAccount({ method, role, communityId, password, firstName, lastName, email, accountPassword }) {
  ready();
  creating = true;
  let credential, fresh;
  try {
    // The popup has to open straight from the click, so nothing is awaited before it.
    if (method === 'google') {
      credential = await googlePopup();
      fresh = Boolean(fb.getAdditionalUserInfo(credential)?.isNewUser);
    } else {
      credential = await fb.createUserWithEmailAndPassword(fb.auth, email.trim(), accountPassword);
      fresh = true;
      await fb.updateProfile(credential.user, { displayName: `${firstName} ${lastName}`.trim() }).catch(() => {});
    }
  } catch (error) {
    creating = false;
    if (closedPopup(error)) return false;
    throw authFailure(error, 'Your account could not be created. Please try again.');
  }
  session.user = credential.user;
  try {
    const { profile } = await api('POST', '/auth/register', { role, communityId: communityId || undefined, password, firstName, lastName });
    session.profile = profile;
    session.enrolled = true;
    session.error = '';
    if (method !== 'google') fb.sendEmailVerification(credential.user).catch(() => {});
  } catch (error) {
    if (fresh) {
      await fb.deleteUser(credential.user).catch(() => fb.signOut(fb.auth));
      session.user = null;
      session.profile = null;
      session.enrolled = false;
    } else {
      // An existing Google account: show the state it is really in.
      await loadProfile();
      if (!session.enrolled) session.error = '';
      notify();
    }
    throw error;
  } finally {
    creating = false;
    session.ready = true;
  }
  notify();
  return true;
}

export async function enroll({ role, communityId, password, firstName, lastName }) {
  const { profile } = await api('POST', '/auth/register', { role, communityId: communityId || undefined, password, firstName, lastName });
  session.profile = profile;
  session.enrolled = true;
  session.error = '';
  notify();
  return profile;
}

export function setProfile(profile) {
  session.profile = profile;
  notify();
}

export async function signOut() {
  await fb?.signOut(fb.auth);
}

// Uploads a file straight to Firebase Storage (ranked skills and online submissions).
// onProgress gets 0–1. Returns a cancel function and a promise for the finished upload.
let storageSdk = null;
export function uploadFile(path, file, onProgress) {
  let task = null, cancelled = false;
  const done = (async () => {
    if (!fb?.app) throw new Error('Sign-in is not ready yet.');
    if (!fb.app.options.storageBucket) throw new Error('File uploads are not configured yet.');
    storageSdk ??= await import(SDK + 'firebase-storage.js');
    if (cancelled) throw new Error('Upload cancelled.');
    const { getStorage, ref, uploadBytesResumable } = storageSdk;
    task = uploadBytesResumable(ref(getStorage(fb.app), path), file, { contentType: file.type || 'application/octet-stream' });
    await new Promise((resolve, reject) => task.on('state_changed',
      (s) => onProgress?.(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0),
      (error) => reject(new Error(error?.code === 'storage/canceled' ? 'Upload cancelled.' : 'The upload failed. Check your connection and try again.')),
      resolve));
  })();
  return { done, cancel: () => { cancelled = true; task?.cancel(); } };
}
