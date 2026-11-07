import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AppError } from './http.js';

const EXPIRED = new Set([
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/argument-error',
  'auth/invalid-argument',
  'auth/invalid-id-token',
  'auth/user-disabled',
  'auth/user-not-found',
]);

let auth = null;
function adminAuth(env) {
  if (auth) return auth;
  auth = getAuth(adminApp(env));
  return auth;
}
// The one Firebase Admin app, shared by sign-in checks and file storage.
export function adminApp(env) {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey)
    throw new AppError(503, 'Account services are not configured yet.');
  return getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

// Returns a verifier that turns a Firebase ID token into { uid, email, emailVerified, name }.
// Tests pass their own verifier to createApp instead of this one.
export function firebaseVerifier(env = process.env) {
  return async (token) => {
    let decoded;
    try {
      // checkRevoked: a disabled or signed-out-everywhere account stops working immediately.
      decoded = await adminAuth(env).verifyIdToken(token, true);
    } catch (error) {
      if (error instanceof AppError) throw error;
      const code = typeof error?.code === 'string' && /^(auth|app)\/[a-z-]{1,60}$/.test(error.code) ? error.code : 'unknown';
      console.error('Firebase session verification failed:', code);
      if (EXPIRED.has(code)) throw new AppError(401, 'Your session has expired. Please log in again.');
      throw new AppError(503, 'Account services are temporarily unavailable. Please try again.');
    }
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: Boolean(decoded.email_verified),
      name: decoded.name ?? null,
    };
  };
}
