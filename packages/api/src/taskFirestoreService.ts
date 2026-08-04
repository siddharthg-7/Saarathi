import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Project, Goal } from '@saarathi/types';

// ================= TASKS =================

export function subscribeToTasks(uid: string, callback: (tasks: Task[]) => void): Unsubscribe {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  const q = query(tasksRef, orderBy('orderIndex', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = snapshot.docs.map((d) => ({
      ...(d.data() as Task),
      id: d.id,
    }));
    callback(tasks);
  });
}

export async function createTaskDoc(uid: string, task: Task): Promise<void> {
  const taskRef = doc(db, 'users', uid, 'tasks', task.id);
  await setDoc(taskRef, {
    ...task,
    uid,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTaskDoc(
  uid: string,
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const taskRef = doc(db, 'users', uid, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
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
    batch.update(taskRef, { orderIndex, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

// ================= PROJECTS =================

export function subscribeToProjects(
  uid: string,
  callback: (projects: Project[]) => void
): Unsubscribe {
  const projectsRef = collection(db, 'users', uid, 'projects');
  return onSnapshot(projectsRef, (snapshot) => {
    const projects: Project[] = snapshot.docs.map((d) => ({
      ...(d.data() as Project),
      id: d.id,
    }));
    callback(projects);
  });
}

export async function createProjectDoc(uid: string, project: Project): Promise<void> {
  const projectRef = doc(db, 'users', uid, 'projects', project.id);
  await setDoc(projectRef, {
    ...project,
    uid,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProjectDoc(uid: string, projectId: string): Promise<void> {
  const projectRef = doc(db, 'users', uid, 'projects', projectId);
  await deleteDoc(projectRef);
}

// ================= GOALS =================

export function subscribeToGoals(uid: string, callback: (goals: Goal[]) => void): Unsubscribe {
  const goalsRef = collection(db, 'users', uid, 'goals');
  return onSnapshot(goalsRef, (snapshot) => {
    const goals: Goal[] = snapshot.docs.map((d) => ({
      ...(d.data() as Goal),
      id: d.id,
    }));
    callback(goals);
  });
}

export async function createGoalDoc(uid: string, goal: Goal): Promise<void> {
  const goalRef = doc(db, 'users', uid, 'goals', goal.id);
  await setDoc(goalRef, {
    ...goal,
    uid,
    createdAt: goal.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}
