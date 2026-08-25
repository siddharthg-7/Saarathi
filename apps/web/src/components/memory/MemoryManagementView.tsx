import React, { useEffect, useState } from 'react';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Target,
  MessageSquare,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Database,
  Layers,
  Power,
  RotateCcw,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { useMemoryStore } from '@saarathi/store';
import { Memory, MemorySourceType, MemoryCreateInput } from '@saarathi/types';

export const MemoryManagementView: React.FC = () => {
  const {
    memories,
    stats,
    searchResults,
    isSearching,
    isLoading,
    memorySystemEnabled,
    fetchMemories,
    fetchStats,
    searchMemories,
    indexMemory,
    updateMemory,
    deleteMemory,
    clearAllMemories,
    toggleMemorySystem,
  } = useMemoryStore();

  const [searchInput, setSearchInput] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState<MemorySourceType | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImportance, setEditImportance] = useState(0.5);

  // New memory form state
  const [newSourceType, setNewSourceType] = useState<MemorySourceType>('user_preference');
  const [newContent, setNewContent] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newImportance, setNewImportance] = useState(0.7);

  useEffect(() => {
    fetchMemories();
    fetchStats();
  }, [fetchMemories, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchMemories(searchInput.trim(), selectedSourceType !== 'all' ? { sourceType: selectedSourceType } : undefined);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    fetchMemories(selectedSourceType !== 'all' ? selectedSourceType : undefined);
  };

  const handleSourceFilterChange = (type: MemorySourceType | 'all') => {
    setSelectedSourceType(type);
    if (searchInput.trim()) {
      searchMemories(searchInput.trim(), type !== 'all' ? { sourceType: type } : undefined);
    } else {
      fetchMemories(type !== 'all' ? type : undefined);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const input: MemoryCreateInput = {
      sourceType: newSourceType,
      content: newContent.trim(),
      summary: newSummary.trim() || undefined,
      importance: newImportance,
    };

    await indexMemory(input);
    setNewContent('');
    setNewSummary('');
    setIsAddModalOpen(false);
  };

  const handleStartEdit = (m: Memory) => {
    setEditingMemoryId(m.id);
    setEditContent(m.content);
    setEditImportance(m.importance);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await updateMemory(id, {
      content: editContent.trim(),
      importance: editImportance,
    });
    setEditingMemoryId(null);
  };

  const getSourceIcon = (sourceType: MemorySourceType) => {
    switch (sourceType) {
      case 'brain_dump':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'goal':
        return <Target className="w-4 h-4 text-emerald-400" />;
      case 'kairo_chat':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'user_preference':
        return <Bookmark className="w-4 h-4 text-pink-400" />;
      case 'task':
      case 'task_history':
        return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
      case 'analytics_insight':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  const displayList: Memory[] = searchInput.trim() && searchResults.length > 0
    ? searchResults.map((r) => ({
        id: r.memoryId,
        userId: r.userId,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        content: r.content,
        summary: r.summary,
        metadata: r.metadata,
        importance: r.importance,
        confidence: r.confidence,
        embeddingModel: 'all-MiniLM-L6-v2',
        embeddingVersion: '1.0.0',
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
        isActive: true,
      }))
    : memories.filter((m) => (selectedSourceType === 'all' ? true : m.sourceType === selectedSourceType));

  return (
    <div className="space-y-6">
      {/* Header & Master Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-surface-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              Long-Term Memory & Hybrid Semantic Retrieval
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                pgvector 384d
              </span>
            </h2>
            <p className="text-xs text-text-muted">
              Persistent memory store enabling Kairo to recall user goals, notes, brain dumps, and preferences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-dark border border-surface-border">
            <Power className={`w-4 h-4 ${memorySystemEnabled ? 'text-emerald-400' : 'text-text-muted'}`} />
            <span className="text-xs font-medium text-text-secondary">Memory Engine</span>
            <button
              onClick={() => toggleMemorySystem(!memorySystemEnabled)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                memorySystemEnabled ? 'bg-emerald-500' : 'bg-surface-border'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  memorySystemEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Memories</span>
          </div>
          <div className="text-xl font-bold text-text-primary font-mono">
            {stats?.totalMemories ?? memories.length}
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Memories</span>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {stats?.activeMemories ?? memories.filter((m) => m.isActive).length}
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Embedding Model</span>
          </div>
          <div className="text-sm font-semibold text-text-primary truncate">
            {stats?.embeddingModel ?? 'all-MiniLM-L6-v2'}
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-surface-border">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Vector Dimensions</span>
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {stats?.dimensions ?? 384}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface p-4 rounded-xl border border-surface-border space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Hybrid semantic search (e.g. 'What was my startup idea about AI?')..."
              className="w-full bg-surface-dark border border-surface-border rounded-xl pl-9 pr-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Source Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => handleSourceFilterChange('all')}
            className={`px-3 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              selectedSourceType === 'all'
                ? 'bg-primary/10 border-primary text-primary-light font-medium'
                : 'bg-surface-dark border-surface-border text-text-muted hover:text-text-primary'
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => handleSourceFilterChange('brain_dump')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              selectedSourceType === 'brain_dump'
                ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-medium'
                : 'bg-surface-dark border-surface-border text-text-muted hover:text-text-primary'
            }`}
          >
            <Brain className="w-3 h-3 text-purple-400" />
            Brain Dumps
          </button>
          <button
            onClick={() => handleSourceFilterChange('note')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              selectedSourceType === 'note'
                ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-medium'
                : 'bg-surface-dark border-surface-border text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText className="w-3 h-3 text-blue-400" />
            Notes
          </button>
          <button
            onClick={() => handleSourceFilterChange('goal')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              selectedSourceType === 'goal'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-medium'
                : 'bg-surface-dark border-surface-border text-text-muted hover:text-text-primary'
            }`}
          >
            <Target className="w-3 h-3 text-emerald-400" />
            Goals
          </button>
          <button
            onClick={() => handleSourceFilterChange('user_preference')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              selectedSourceType === 'user_preference'
                ? 'bg-pink-500/10 border-pink-500 text-pink-400 font-medium'
                : 'bg-surface-dark border-surface-border text-text-muted hover:text-text-primary'
            }`}
          >
            <Bookmark className="w-3 h-3 text-pink-400" />
            Preferences
          </button>
          <button
            onClick={() => handleSourceFilterChange('kairo_chat')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              selectedSourceType === 'kairo_chat'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                : 'bg-surface-dark border-surface-border text-text-muted hover:text-text-primary'
            }`}
          >
            <MessageSquare className="w-3 h-3 text-amber-400" />
            Kairo Chats
          </button>
        </div>
      </div>

      {/* Memory List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {searchInput.trim() ? `Search Results (${displayList.length})` : `Stored Memories (${displayList.length})`}
          </h3>
          {memories.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="bg-surface p-8 rounded-xl border border-surface-border text-center text-text-muted text-sm">
            Loading memories from pgvector store...
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-surface p-8 rounded-xl border border-surface-border text-center space-y-2">
            <Brain className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm font-medium text-text-secondary">No memories found</p>
            <p className="text-xs text-text-muted">
              {searchInput.trim()
                ? 'No matches found for your hybrid query. Try adjusting terms.'
                : 'Add notes, brain dumps, or tell Kairo facts to build long-term memory.'}
            </p>
          </div>
        ) : (
          displayList.map((m) => {
            const isEditing = editingMemoryId === m.id;
            return (
              <div
                key={m.id}
                className="bg-surface p-4 rounded-xl border border-surface-border hover:border-surface-border/80 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-surface-dark border border-surface-border">
                      {getSourceIcon(m.sourceType)}
                    </div>
                    <span className="text-xs font-semibold text-text-primary capitalize">
                      {m.sourceType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-text-muted text-xs">•</span>
                    <span className="text-[11px] text-text-muted">
                      {new Date(m.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-surface-dark border border-surface-border text-text-secondary font-mono">
                      Imp: {Math.round(m.importance * 100)}%
                    </span>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-1 text-text-muted hover:text-text-primary transition-colors"
                          title="Edit memory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMemory(m.id)}
                          className="p-1 text-text-muted hover:text-red-400 transition-colors"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-surface-dark border border-surface-border rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted">Importance:</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={editImportance}
                          onChange={(e) => setEditImportance(parseFloat(e.target.value))}
                          className="w-24 accent-primary"
                        />
                        <span className="text-xs font-mono text-text-secondary">
                          {Math.round(editImportance * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingMemoryId(null)}
                          className="px-2.5 py-1 text-xs text-text-muted hover:text-text-primary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(m.id)}
                          className="px-3 py-1 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </p>
                    {m.summary && m.summary !== m.content && (
                      <p className="text-xs text-text-muted mt-1.5 bg-surface-dark/40 p-2 rounded-lg border border-surface-border/50">
                        {m.summary}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Add Long-Term Memory</h3>
                <p className="text-xs text-text-muted">Directly commit knowledge into pgvector semantic memory</p>
              </div>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Source Type</label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value as MemorySourceType)}
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="user_preference">User Preference</option>
                  <option value="note">Note</option>
                  <option value="brain_dump">Brain Dump</option>
                  <option value="goal">Goal</option>
                  <option value="task_history">Task History</option>
                  <option value="analytics_insight">Analytics Insight</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Memory Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. I prefer doing difficult algorithmic coding sessions in the morning before 10 AM..."
                  rows={4}
                  required
                  className="w-full bg-surface-dark border border-surface-border rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Summary (Optional)</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief 1-sentence summary"
                  className="w-full bg-surface-dark border border-surface-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-text-secondary">Importance Weight</label>
                  <span className="text-xs font-mono text-primary-light font-semibold">
                    {Math.round(newImportance * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={newImportance}
                  onChange={(e) => setNewImportance(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-primary/20"
                >
                  Index Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center gap-2 mb-3 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-semibold text-text-primary">Clear All Memories?</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              This will permanently delete all indexed long-term semantic memories for your account from the vector database. Kairo will forget all past conversational context and preferences.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllMemories();
                  setIsClearModalOpen(false);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
