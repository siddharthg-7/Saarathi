import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '@saarathi/store';

describe('Task Edge Cases & Boundary Handling', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      activeUid: null, // Keep null for offline in-memory unit tests
    });
  });

  it('should handle tasks with special characters and emoji in title', async () => {
    const { addTask } = useTaskStore.getState();
    const specialTitle = '🔥 Complete CI/CD Pipeline! <script>alert("test")</script> & # @ $ %';

    await addTask(specialTitle, 'DevOps', 'High');

    const tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe(specialTitle);
    expect(tasks[0].status).toBe('pending');
  });

  it('should handle extremely long task titles (>1,000 chars) without crashing', async () => {
    const { addTask } = useTaskStore.getState();
    const giantTitle = 'A'.repeat(1200);

    await addTask(giantTitle, 'General', 'Low');

    const tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].title.length).toBe(1200);
  });

  it('should handle rapid task completion toggling without state corruption', () => {
    const { addTask, toggleTaskComplete } = useTaskStore.getState();
    addTask('Rapid Toggle Task', 'Work', 'Medium');

    const taskId = useTaskStore.getState().tasks[0].id;

    // Toggle 10 times in rapid succession
    for (let i = 0; i < 10; i++) {
      toggleTaskComplete(taskId);
    }

    const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    expect(task).toBeDefined();
    // 10 toggles from 'pending' (even number) returns to 'pending'
    expect(task?.status).toBe('pending');
  });

  it('should handle task postponement counter increments', async () => {
    const { addTask, postponeTask } = useTaskStore.getState();
    await addTask('Postpone Candidate', 'Study', 'Medium');

    const taskId = useTaskStore.getState().tasks[0].id;
    await postponeTask(taskId);
    await postponeTask(taskId);
    await postponeTask(taskId);

    const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    expect(task?.postponeCount).toBe(3);
  }, 15000);

  it('should delete a task cleanly from local state', async () => {
    const { addTask, deleteTask } = useTaskStore.getState();
    await addTask('Task To Delete', 'Work', 'Low');

    const taskId = useTaskStore.getState().tasks[0].id;
    expect(useTaskStore.getState().tasks.length).toBe(1);

    await deleteTask(taskId);
    expect(useTaskStore.getState().tasks.length).toBe(0);
  });
});
