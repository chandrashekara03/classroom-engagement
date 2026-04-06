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

function initAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountPath = resolveServiceAccountPath();

  if (!serviceAccountPath) {
    throw new Error(
      'Service account JSON not found. Set FIREBASE_SERVICE_ACCOUNT_PATH or place firebase-adminsdk JSON in project root.'
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const projectId =
    serviceAccount.project_id ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'classroomengagement-2026';
  const defaultDatabaseUrl =
    projectId === 'classroomengagement-2026'
      ? 'https://classroomengagement-2026-default-rtdb.asia-southeast1.firebasedatabase.app'
      : `https://${projectId}-default-rtdb.firebaseio.com`;
  const databaseURL =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    defaultDatabaseUrl;

  console.log(`Using Firebase project: ${projectId}`);
  console.log(`Using Realtime DB URL: ${databaseURL}`);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
    projectId,
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
  initAdmin();
  const db = admin.database();

  const requiredSections = {
    metadata: {
      schemaVersion: 1,
      initializedAt: new Date().toISOString(),
      app: 'classroom-engagement',
    },
    admins: {},
    teachers: {},
    users: {},
    activityLogs: {},
    sessions: {},
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
