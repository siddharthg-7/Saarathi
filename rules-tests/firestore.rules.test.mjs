import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-saarathi';
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

const OWNER = 'owner-uid';
const OTHER = 'other-uid';

let testEnv;
let allowPass = 0;
let denyPass = 0;
const failures = [];

async function checkAllow(name, promise) {
  try {
    await assertSucceeds(promise);
    allowPass++;
    console.log(`  PASS (allow)  ${name}`);
  } catch (e) {
    failures.push(`ALLOW FAIL: ${name} -> ${e.message}`);
    console.log(`  FAIL (allow)  ${name}: ${e.message}`);
  }
}

async function checkDeny(name, promise) {
  try {
    await assertFails(promise);
    denyPass++;
    console.log(`  PASS (deny)   ${name}`);
  } catch (e) {
    failures.push(`DENY FAIL: ${name} -> ${e.message}`);
    console.log(`  FAIL (deny)   ${name}: ${e.message}`);
  }
}

async function main() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  });

  const ownerDb = testEnv.authenticatedContext(OWNER).firestore();
  const otherDb = testEnv.authenticatedContext(OTHER).firestore();
  const anonDb = testEnv.unauthenticatedContext().firestore();

  console.log('\n=== ALLOW CASES (authenticated owner) ===');

  // Profile (users/{uid})
  await checkAllow('owner create own profile', setDoc(doc(ownerDb, 'users', OWNER), { uid: OWNER, email: 'a@b.co' }));
  await checkAllow('owner read own profile', getDoc(doc(ownerDb, 'users', OWNER)));
  await checkAllow('owner update own profile', updateDoc(doc(ownerDb, 'users', OWNER), { bio: 'x' }));

  // Tasks (users/{uid}/tasks/{id})
  await checkAllow('owner create own task', setDoc(doc(ownerDb, 'users', OWNER, 'tasks', 't1'), { uid: OWNER, title: 't' }));
  await checkAllow('owner read own task', getDoc(doc(ownerDb, 'users', OWNER, 'tasks', 't1')));
  await checkAllow('owner update own task', updateDoc(doc(ownerDb, 'users', OWNER, 'tasks', 't1'), { title: 'u' }));

  // Projects (users/{uid}/projects/{id})
  await checkAllow('owner create own project', setDoc(doc(ownerDb, 'users', OWNER, 'projects', 'p1'), { uid: OWNER }));
  await checkAllow('owner read own project', getDoc(doc(ownerDb, 'users', OWNER, 'projects', 'p1')));

  // Goals (users/{uid}/goals/{id})
  await checkAllow('owner create own goal', setDoc(doc(ownerDb, 'users', OWNER, 'goals', 'g1'), { uid: OWNER }));
  await checkAllow('owner read own goal', getDoc(doc(ownerDb, 'users', OWNER, 'goals', 'g1')));

  // Settings (settings/{uid})
  await checkAllow('owner write own settings', setDoc(doc(ownerDb, 'settings', OWNER), { uid: OWNER, theme: 'dark' }));
  await checkAllow('owner read own settings', getDoc(doc(ownerDb, 'settings', OWNER)));

  // Devices (devices/{uid}/user_devices/{id})
  await checkAllow('owner write own device', setDoc(doc(ownerDb, 'devices', OWNER, 'user_devices', 'd1'), { uid: OWNER }));

  // Sessions (sessions/{uid}/user_sessions/{id})
  await checkAllow('owner write own session', setDoc(doc(ownerDb, 'sessions', OWNER, 'user_sessions', 's1'), { uid: OWNER }));

  console.log('\n=== DENY CASES (cross-user / unauthenticated) ===');

  // Cross-user: OTHER touches OWNER's data
  await checkDeny('other read owner profile', getDoc(doc(otherDb, 'users', OWNER)));
  await checkDeny('other create owner profile', setDoc(doc(otherDb, 'users', OWNER), { uid: OWNER }));
  await checkDeny('other read owner task', getDoc(doc(otherDb, 'users', OWNER, 'tasks', 't1')));
  await checkDeny('other write owner task', setDoc(doc(otherDb, 'users', OWNER, 'tasks', 't1'), { uid: OWNER }));
  await checkDeny('other read owner project', getDoc(doc(otherDb, 'users', OWNER, 'projects', 'p1')));
  await checkDeny('other read owner goal', getDoc(doc(otherDb, 'users', OWNER, 'goals', 'g1')));
  await checkDeny('other read owner settings', getDoc(doc(otherDb, 'settings', OWNER)));
  await checkDeny('other read owner device', getDoc(doc(otherDb, 'devices', OWNER, 'user_devices', 'd1')));
  await checkDeny('other read owner session', getDoc(doc(otherDb, 'sessions', OWNER, 'user_sessions', 's1')));

  // Owner writing to a path owned by a different uid
  await checkDeny('owner writes under other uid path', setDoc(doc(ownerDb, 'users', OTHER), { uid: OTHER }));

  // Profile deletion is forbidden
  await checkDeny('owner delete own profile', deleteDoc(doc(ownerDb, 'users', OWNER)));

  // Unauthenticated access
  await checkDeny('anon read owner profile', getDoc(doc(anonDb, 'users', OWNER)));
  await checkDeny('anon read owner task', getDoc(doc(anonDb, 'users', OWNER, 'tasks', 't1')));
  await checkDeny('anon write profile', setDoc(doc(anonDb, 'users', 'anon'), { uid: 'anon' }));
  await checkDeny('anon read settings', getDoc(doc(anonDb, 'settings', OWNER)));

  console.log('\n=== RESULT ===');
  console.log(`Allow cases passed: ${allowPass}`);
  console.log(`Deny cases passed:  ${denyPass}`);
  if (failures.length) {
    console.log(`\nFAILURES (${failures.length}):`);
    failures.forEach((f) => console.log(' - ' + f));
    process.exitCode = 1;
  } else {
    console.log('All rules tests passed.');
  }
}

main()
  .catch((e) => {
    console.error('Test harness error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (testEnv) await testEnv.cleanup();
  });
