import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTaskStore } from '@saarathi/store';
import { Task, EnergyLevel } from '@saarathi/types';

export default function Tasks() {
  const { getFilteredTasks, addTask, toggleTaskComplete, postponeTask, deleteTask, setFilter, filter } = useTaskStore();
  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState('Coding');
  const [energy, setEnergy] = useState<EnergyLevel>('Medium');

  const handleAddTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    await addTask(newTitle, category, energy);
    setNewTitle('');
  };

  const filteredTasks = getFilteredTasks();

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return '#EF4444';
      case 'Low':
        return '#10B981';
      default:
        return '#F59E0B';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Tasks</Text>

      {/* Task Input Form */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          placeholderTextColor="#64748B"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <View style={styles.formOptions}>
          <TextInput
            style={[styles.smallInput, { flex: 1, marginRight: 8 }]}
            placeholder="Category"
            placeholderTextColor="#64748B"
            value={category}
            onChangeText={setCategory}
          />
          <View style={styles.energyToggleContainer}>
            {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.energyBtn, energy === e && styles.energyBtnActive]}
                onPress={() => setEnergy(e)}
              >
                <Text style={[styles.energyBtnText, energy === e && styles.energyBtnTextActive]}>
                  {e[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddTask}>
          <Text style={styles.addBtnText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Search Filter */}
      <TextInput
        style={styles.searchBar}
        placeholder="🔍 Search tasks..."
        placeholderTextColor="#64748B"
        value={filter.searchQuery}
        onChangeText={(text) => setFilter({ searchQuery: text })}
      />

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.taskCard, item.status === 'completed' && styles.taskCardCompleted]}>
            <View style={styles.taskHeader}>
              <TouchableOpacity
                style={[styles.checkbox, item.status === 'completed' && styles.checkboxChecked]}
                onPress={() => toggleTaskComplete(item.id)}
              >
                {item.status === 'completed' && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.taskTitle, item.status === 'completed' && styles.taskTitleCompleted]}>
                  {item.title}
                </Text>
                <View style={styles.tagRow}>
                  <Text style={styles.categoryTag}>{item.category}</Text>
                  <Text style={[styles.priorityTag, { color: getPriorityColor(item.priority) }]}>
                    {item.priority || 'Medium'} Priority
                  </Text>
                  <Text style={styles.energyTag}>🔋 {item.energyRequired}</Text>
                </View>
              </View>
            </View>

            {item.status !== 'completed' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.postponeBtn} onPress={() => postponeTask(item.id)}>
                  <Text style={styles.actionBtnText}>⏳ Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(item.id)}>
                  <Text style={styles.actionBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found. Add some tasks above!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 14,
    marginBottom: 12,
  },
  formOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 12,
  },
  energyToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 2,
  },
  energyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  energyBtnActive: {
    backgroundColor: '#3B82F6',
  },
  energyBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  energyBtnTextActive: {
    color: '#F8FAFC',
  },
  addBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
  },
  checkMark: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  categoryTag: {
    fontSize: 10,
    backgroundColor: '#334155',
    color: '#94A3B8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityTag: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 6,
  },
  energyTag: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  postponeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7F1D1D',
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
  },
});
