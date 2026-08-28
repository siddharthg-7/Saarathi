import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
  increment,
  updateDoc,
  SnapshotMetadata,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Project, Goal } from '@saarathi/types';
import { executeVersionedTransaction } from './syncService';

export interface PaginatedTaskResult {
  tasks: Task[];
  lastVisibleDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// ================= TASKS =================

export function subscribeToTasks(
  uid: string,
  callback: (tasks: Task[], metadata?: SnapshotMetadata) => void,
  maxResults: number = 200
): Unsubscribe {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  const q = query(tasksRef, orderBy('orderIndex', 'asc'), limit(maxResults));
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = snapshot.docs.map((d) => ({
      ...(d.data() as Task),
      id: d.id,
      syncStatus: snapshot.metadata.hasPendingWrites ? 'pending' : 'synced',
    }));
    callback(tasks, snapshot.metadata);
  });
}

/**
 * High-performance cursor-based pagination for querying large task collections
 */
export async function fetchTasksPaginated(
  uid: string,
  pageSize: number = 50,
  lastVisibleDoc: DocumentSnapshot | null = null,
  statusFilter?: 'pending' | 'in_progress' | 'completed' | 'skipped'
): Promise<PaginatedTaskResult> {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  let q = query(tasksRef);

  if (statusFilter) {
    q = query(q, where('status', '==', statusFilter), orderBy('updatedAt', 'desc'), limit(pageSize));
  } else {
    q = query(q, orderBy('orderIndex', 'asc'), limit(pageSize));
  }

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
  }

  const snapshot = await getDocs(q);
  const tasks: Task[] = snapshot.docs.map((d) => ({
    ...(d.data() as Task),
    id: d.id,
  }));

  const nextLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    tasks,
    lastVisibleDoc: nextLastDoc,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function createTaskDoc(uid: string, task: Task): Promise<void> {
  const taskRef = doc(db, 'users', uid, 'tasks', task.id);
  await setDoc(taskRef, {
    ...task,
    uid,
    version: task.version || 1,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTaskDoc(
  uid: string,
  taskId: string,
  updates: Partial<Task>,
  expectedBaseVersion?: number
): Promise<void> {
  const taskRef = doc(db, 'users', uid, 'tasks', taskId);
  
  if (expectedBaseVersion !== undefined) {
    await executeVersionedTransaction(taskRef, updates, expectedBaseVersion);
  } else {
    await updateDoc(taskRef, {
      ...updates,
      version: increment(1),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteTaskDoc(uid: string, taskId: string): Promise<void> {
  const taskRef = doc(db, 'users', uid, 'tasks', taskId);
  await deleteDoc(taskRef);
}

export async function reorderTasksBatch(
  uid: string,
  orderedTasks: { id: string; orderIndex: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  orderedTasks.forEach(({ id, orderIndex }) => {
    const taskRef = doc(db, 'users', uid, 'tasks', id);
    batch.update(taskRef, {
      orderIndex,
      version: increment(1),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

// ================= PROJECTS =================

export function subscribeToProjects(
  uid: string,
  callback: (projects: Project[], metadata?: SnapshotMetadata) => void
): Unsubscribe {
  const projectsRef = collection(db, 'users', uid, 'projects');
  return onSnapshot(projectsRef, (snapshot) => {
    const projects: Project[] = snapshot.docs.map((d) => ({
      ...(d.data() as Project),
      id: d.id,
      syncStatus: snapshot.metadata.hasPendingWrites ? 'pending' : 'synced',
    }));
    callback(projects, snapshot.metadata);
  });
}

export async function createProjectDoc(uid: string, project: Project): Promise<void> {
  const projectRef = doc(db, 'users', uid, 'projects', project.id);
  await setDoc(projectRef, {
    ...project,
    uid,
    version: project.version || 1,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProjectDoc(uid: string, projectId: string): Promise<void> {
  const projectRef = doc(db, 'users', uid, 'projects', projectId);
  await deleteDoc(projectRef);
}

// ================= GOALS =================

export function subscribeToGoals(
  uid: string,
  callback: (goals: Goal[], metadata?: SnapshotMetadata) => void
): Unsubscribe {
  const goalsRef = collection(db, 'users', uid, 'goals');
  return onSnapshot(goalsRef, (snapshot) => {
    const goals: Goal[] = snapshot.docs.map((d) => ({
      ...(d.data() as Goal),
      id: d.id,
      syncStatus: snapshot.metadata.hasPendingWrites ? 'pending' : 'synced',
    }));
    callback(goals, snapshot.metadata);
  });
}

export async function createGoalDoc(uid: string, goal: Goal): Promise<void> {
  const goalRef = doc(db, 'users', uid, 'goals', goal.id);
  await setDoc(goalRef, {
    ...goal,
    uid,
    version: goal.version || 1,
    createdAt: goal.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}
