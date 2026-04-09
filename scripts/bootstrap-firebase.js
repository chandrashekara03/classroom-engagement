const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function resolveServiceAccountPath() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const cwd = process.cwd();
  const candidate = fs
    .readdirSync(cwd)
    .find((file) => file.includes('firebase-adminsdk') && file.endsWith('.json'));

  return candidate ? path.join(cwd, candidate) : null;
}

async function initAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountPath = resolveServiceAccountPath();

  const projectIdFromEnv =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'classroomengagement-2026';
  const projectId = serviceAccountPath
    ? JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')).project_id || projectIdFromEnv
    : projectIdFromEnv;
  const defaultDatabaseUrl =
    projectId === 'classroomengagement-2026'
      ? 'https://classroomengagement-2026-default-rtdb.asia-southeast1.firebasedatabase.app'
      : `https://${projectId}-default-rtdb.firebaseio.com`;
  const databaseURL =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    defaultDatabaseUrl;

  console.log(`Using Firebase project: ${projectId}`);
  console.log(`Using Realtime DB URL: ${databaseURL}`);

  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL,
      projectId,
    });
  }

  console.warn(
    'Service account JSON not found. Falling back to default credentials (ADC/environment).' +
      ' Set FIREBASE_SERVICE_ACCOUNT_PATH for explicit service account auth.'
  );

  const applicationDefaultCredential = admin.credential.applicationDefault();

  try {
    await applicationDefaultCredential.getAccessToken();
  } catch {
    throw new Error(
      'No Firebase admin credentials found. Set FIREBASE_SERVICE_ACCOUNT_PATH to a firebase-adminsdk JSON or configure Google ADC.'
    );
  }

  return admin.initializeApp({
    credential: applicationDefaultCredential,
    projectId,
    databaseURL,
  });
}

async function ensureSection(db, key, defaultValue) {
  const ref = db.ref(key);
  const snap = await ref.get();

  if (!snap.exists()) {
    await ref.set(defaultValue);
    return 'created';
  }

  return 'exists';
}

async function main() {
  await initAdmin();
  const db = admin.database();

  const requiredSections = {
    metadata: {
      schemaVersion: 1,
      initializedAt: new Date().toISOString(),
      app: 'classroom-engagement',
    },
    admins: {},
    teachers: {},
    students: {},
    users: {},
    roleOptions: {
      roles: [
        {
          value: 'admin',
          label: 'Admin',
          description: 'Can manage users, roles, and admin dashboard settings.',
          enabled: true,
        },
        {
          value: 'teacher',
          label: 'Teacher',
          description: 'Can create activities, sessions, and review classroom analytics.',
          enabled: true,
        },
        {
          value: 'student',
          label: 'Student',
          description: 'Can join sessions and submit activity responses.',
          enabled: true,
        },
      ],
      departments: [
        { value: 'computer-science', label: 'Computer Science' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'physics', label: 'Physics' },
        { value: 'commerce', label: 'Commerce' },
        { value: 'management', label: 'Management' },
      ],
      updatedAt: new Date().toISOString(),
    },
    adminRoleChanges: {},
    activityLogs: {},
    sessions: {},
    responses: {},
    activityTemplates: {},
    auditLogs: {},
  };

  const results = {};
  for (const [key, value] of Object.entries(requiredSections)) {
    results[key] = await ensureSection(db, key, value);
  }

  // --- NEW: Deploy Rules ---
  console.log('Deploying security rules from database.rules.json...');
  try {
    const rulesPath = path.join(process.cwd(), 'database.rules.json');
    if (fs.existsSync(rulesPath)) {
      const rules = fs.readFileSync(rulesPath, 'utf8');
      await db.setRules(rules);
      console.log('✓ Security rules applied successfully');
    } else {
      console.warn('! database.rules.json not found, skipping rule deployment');
    }
  } catch (error) {
    console.error('! Failed to apply security rules:', error.message);
  }

  console.log('\nFirebase bootstrap complete:');
  for (const [key, status] of Object.entries(results)) {
    console.log(`- ${key}: ${status}`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Firebase bootstrap failed:', error.message || error);
  process.exit(1);
});
