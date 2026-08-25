export type MemorySourceType =
  | 'kairo_chat'
  | 'note'
  | 'brain_dump'
  | 'goal'
  | 'task'
  | 'task_history'
  | 'analytics_insight'
  | 'user_preference';

export interface MemoryMetadata {
  category?: string;
  tags?: string[];
  sourceId?: string;
  taskId?: string;
  goalId?: string;
  projectId?: string;
  date?: string;
  timezone?: string;
  language?: string;
  importance?: number;
  [key: string]: any;
}

export interface Memory {
  id: string;
  userId: string;
  sourceType: MemorySourceType;
  sourceId?: string;
  content: string;
  summary?: string;
  metadata?: MemoryMetadata;
  importance: number;
  confidence: number;
  contentHash?: string;
  embeddingModel: string;
  embeddingVersion: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  deletedAt?: string;
}

export interface MemoryCreateInput {
  sourceType: MemorySourceType;
  sourceId?: string;
  content: string;
  summary?: string;
  metadata?: MemoryMetadata;
  importance?: number;
  confidence?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface MemoryUpdateInput {
  content?: string;
  summary?: string;
  metadata?: MemoryMetadata;
  importance?: number;
  isActive?: boolean;
}

export interface MemorySearchFilter {
  sourceType?: MemorySourceType;
  category?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  minImportance?: number;
  isActive?: boolean;
}

export interface MemorySearchQuery {
  query: string;
  filter?: MemorySearchFilter;
  matchThreshold?: number;
  matchCount?: number;
  semanticWeight?: number;
  keywordWeight?: number;
}

export interface HybridSearchResult {
  memoryId: string;
  userId: string;
  sourceType: MemorySourceType;
  sourceId?: string;
  content: string;
  summary?: string;
  metadata?: MemoryMetadata;
  importance: number;
  confidence: number;
  semanticScore: number;
  keywordScore: number;
  hybridScore: number;
  createdAt: string;
}

export interface MemorySearchResponse {
  query: string;
  results: HybridSearchResult[];
  totalMatches: number;
  retrievalLatencyMs: number;
}

export interface MemoryStats {
  totalMemories: number;
  activeMemories: number;
  countsBySource: Record<string, number>;
  embeddingModel: string;
  dimensions: number;
}
