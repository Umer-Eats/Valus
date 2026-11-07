// Student uploads for ranked skills and online submissions live in Firebase Storage.
// Browsers upload straight to Firebase (storage.rules decides who may write), so files never
// pass through this server. The server only checks a file exists and was made during the
// student's session, and hands teachers a short-lived link to view it.
import { getStorage } from 'firebase-admin/storage';
import { adminApp } from './auth.js';
import { AppError } from './http.js';

export const UPLOAD_MAX_BYTES = 500 * 1024 * 1024;
export const UPLOAD_MAX_FILES = 5;
// Accepts the bucket name with or without the gs:// prefix the Firebase console shows.
export const bucketName = (env) => (env.FIREBASE_STORAGE_BUCKET ?? '').trim().replace(/^gs:\/\//i, '').replace(/\/+$/, '');
// Matches storage.rules: ranked/{uid}/{assignmentId}/{fileId}
export const uploadFolder = (uid, assignmentId) => `ranked/${uid}/${assignmentId}/`;

export function firebaseStorage(env = process.env) {
  let bucket = null;
  const files = () => {
    if (bucket) return bucket;
    const name = bucketName(env);
    if (!name) throw new AppError(503, 'File uploads are not configured yet.');
    bucket = getStorage(adminApp(env)).bucket(name);
    return bucket;
  };
  return {
    configured: () => Boolean(bucketName(env)),
    async info(path) {
      try {
        const [m] = await files().file(path).getMetadata();
        return { size: Number(m.size), contentType: m.contentType || 'application/octet-stream', created: m.timeCreated };
      } catch (error) {
        if (error instanceof AppError) throw error;
        if (error?.code === 404) return null;
        throw new AppError(503, 'File storage could not be reached. Try again.');
      }
    },
    // Signed with the service account key locally, so making a link is free and instant.
    async viewUrl(path, name) {
      const [url] = await files().file(path).getSignedUrl({
        version: 'v4', action: 'read', expires: Date.now() + 15 * 60_000,
        responseDisposition: `inline; filename="${String(name).replace(/[^\w.\- ]/g, '_')}"`,
      });
      return url;
    },
  };
}
