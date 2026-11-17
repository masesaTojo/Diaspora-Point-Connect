import fs from 'node:fs';
import path from 'node:path';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export type AdminCredentialMode = 'service_account_json' | 'env_cert' | 'adc' | 'project_only';

export interface FirebaseAdminContext {
  app: App;
  auth: Auth;
  db: Firestore | null;
  projectId: string;
  firestoreDatabaseId: string;
  credentialMode: AdminCredentialMode;
}

interface AppletConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
}

function readAppletConfig(): AppletConfig {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8')) as AppletConfig;
    }
  } catch {
    // Fallback to defaults or environment variables
  }
  return {};
}

let cachedContext: FirebaseAdminContext | null = null;

function resolveCredential(): {
  credential?: ReturnType<typeof cert> | ReturnType<typeof applicationDefault>;
  mode: AdminCredentialMode;
} {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (serviceAccountRaw) {
    const parsed = JSON.parse(serviceAccountRaw) as ServiceAccount;
    return { credential: cert(parsed), mode: 'service_account_json' };
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || readAppletConfig().projectId;

  if (clientEmail && privateKeyRaw && projectId) {
    return {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
      }),
      mode: 'env_cert',
    };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    return {
      credential: applicationDefault(),
      mode: 'adc',
    };
  }

  return { mode: 'project_only' };
}

export function getFirebaseAdminContext(): FirebaseAdminContext {
  if (cachedContext) return cachedContext;

  const appletConfig = readAppletConfig();
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    appletConfig.projectId ||
    'coherent-stacker-mdtd0';

  const firestoreDatabaseId =
    process.env.FIREBASE_FIRESTORE_DATABASE_ID?.trim() ||
    appletConfig.firestoreDatabaseId ||
    '(default)';

  const existingApps = getApps();
  let app: App;
  let credentialMode: AdminCredentialMode = 'project_only';

  if (existingApps.length > 0) {
    app = existingApps[0];
    credentialMode = resolveCredential().mode;
  } else {
    const resolved = resolveCredential();
    credentialMode = resolved.mode;
    app = resolved.credential
      ? initializeApp({ credential: resolved.credential, projectId })
      : initializeApp({ projectId });
  }

  const auth = getAuth(app);
  let db: Firestore | null = null;
  try {
    db = firestoreDatabaseId === '(default)' ? getFirestore(app) : getFirestore(app, firestoreDatabaseId);
  } catch (err) {
    console.warn('Firestore Admin initialization skipped:', (err as Error)?.message);
    db = null;
  }

  cachedContext = {
    app,
    auth,
    db,
    projectId,
    firestoreDatabaseId,
    credentialMode,
  };

  return cachedContext;
}
