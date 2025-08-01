
import * as admin from 'firebase-admin';

const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('The FIREBASE_PRIVATE_KEY environment variable is not set.');
  }

  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The 'replace' is necessary to format the private key correctly from an env var.
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

const app = getFirebaseAdminApp();
const db = admin.firestore(app);

export { app, db };
