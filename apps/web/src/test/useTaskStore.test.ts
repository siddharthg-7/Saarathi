import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '@saarathi/store';

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [] });
  });

  it('should add a task to state', () => {
    useTaskStore.getState().addTask('Test New Task', 'Coding', 'High');
    const tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Test New Task');
    expect(tasks[0].category).toBe('Coding');
    expect(tasks[0].energyRequired).toBe('High');
    expect(tasks[0].status).toBe('pending');
  });

  it('should toggle task complete status', () => {
    useTaskStore.getState().addTask('Task To Complete', 'Study', 'Medium');
    const taskId = useTaskStore.getState().tasks[0].id;

    useTaskStore.getState().toggleTaskComplete(taskId);
    expect(useTaskStore.getState().tasks[0].status).toBe('completed');

    useTaskStore.getState().toggleTaskComplete(taskId);
    expect(useTaskStore.getState().tasks[0].status).toBe('pending');
  });

  it('should delete a task from state', () => {
    useTaskStore.getState().addTask('Task To Delete', 'Work', 'Low');
    const taskId = useTaskStore.getState().tasks[0].id;

    useTaskStore.getState().deleteTask(taskId);
    expect(useTaskStore.getState().tasks.length).toBe(0);
  });
});
