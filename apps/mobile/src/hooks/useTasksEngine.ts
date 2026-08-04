import { useEffect } from 'react';
import { useTaskStore, useAuthStore } from '@saarathi/store';

export function useTasksEngine() {
  const { userProfile } = useAuthStore();
  const {
    tasks,
    projects,
    filter,
    isLoading,
    initTaskListener,
    addTask,
    toggleTaskComplete,
    postponeTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTasks,
    addProject,
    deleteProject,
    setFilter,
    resetFilter,
    getFilteredTasks,
  } = useTaskStore();

  useEffect(() => {
    if (userProfile.id) {
      const unsubscribe = initTaskListener(userProfile.id);
      return () => unsubscribe();
    }
  }, [userProfile.id]);

  const filteredTasks = getFilteredTasks();

  return {
    tasks,
    filteredTasks,
    projects,
    filter,
    isLoading,
    addTask,
    toggleTaskComplete,
    postponeTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTasks,
    addProject,
    deleteProject,
    setFilter,
    resetFilter,
  };
}
