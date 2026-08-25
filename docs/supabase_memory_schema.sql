-- Saarathi OS — Phase 11 Long-Term Memory & Hybrid Semantic Retrieval Schema
-- Database: Supabase PostgreSQL with pgvector extension

-- 1. Enable the pgvector extension for dense semantic vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the memories table
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    source_type TEXT NOT NULL,          -- 'kairo_chat' | 'note' | 'brain_dump' | 'goal' | 'task' | 'task_history' | 'analytics_insight' | 'user_preference'
    source_id TEXT,                     -- ID of the originating document/item in Firestore
    content TEXT NOT NULL,              -- Full text content
    summary TEXT,                       -- Normalized semantic summary
    embedding vector(384),              -- 384-dimensional dense embedding (e.g. all-MiniLM-L6-v2)
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(content, '') || ' ' || coalesce(summary, ''))
    ) STORED,                           -- PostgreSQL native Full-Text Search tsvector
    metadata JSONB DEFAULT '{}'::jsonb, -- Categorical tags, project references, dates, etc.
    importance FLOAT DEFAULT 0.5,       -- 0.0 (transient) to 1.0 (critical long-term preference)
    confidence FLOAT DEFAULT 1.0,       -- 0.0 to 1.0 certainty score
    content_hash TEXT,                  -- SHA-256 hash to prevent duplicate embedding recalculation
    embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2',
    embedding_version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMPTZ
);

-- 3. High-Performance Indexes
-- User isolation index (ensures sub-millisecond user-scoped queries)
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);

-- Full-text keyword search index (GIN index on tsvector)
CREATE INDEX IF NOT EXISTS idx_memories_search_vector ON memories USING GIN(search_vector);

-- Vector similarity search index (HNSW index for cosine distance)
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING hnsw (embedding vector_cosine_ops);

-- Source reference lookup index
CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(user_id, source_type, source_id);

-- Content hash lookup index (prevents redundant embedding generation)
CREATE INDEX IF NOT EXISTS idx_memories_content_hash ON memories(user_id, content_hash);

-- 4. Supabase Row Level Security (RLS) Policies
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view only their own memories
CREATE POLICY "Users can only read their own memories"
    ON memories
    FOR SELECT
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Allow authenticated users to insert only their own memories
CREATE POLICY "Users can only insert their own memories"
    ON memories
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Allow authenticated users to update only their own memories
CREATE POLICY "Users can only update their own memories"
    ON memories
    FOR UPDATE
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Allow authenticated users to delete only their own memories
CREATE POLICY "Users can only delete their own memories"
    ON memories
    FOR DELETE
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- 5. Hybrid Search Match Function (RPC helper for Supabase client)
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(384),
    query_text text,
    filter_user_id text,
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 10,
    semantic_weight float DEFAULT 0.7,
    keyword_weight float DEFAULT 0.3,
    filter_source_type text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    source_type TEXT,
    source_id TEXT,
    content TEXT,
    summary TEXT,
    metadata JSONB,
    importance FLOAT,
    confidence FLOAT,
    semantic_score FLOAT,
    keyword_score FLOAT,
    hybrid_score FLOAT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH semantic_matches AS (
        SELECT
            m.id,
            1 - (m.embedding <=> query_embedding) AS s_score
        FROM memories m
        WHERE m.user_id = filter_user_id
          AND m.is_active = TRUE
          AND m.deleted_at IS NULL
          AND (filter_source_type IS NULL OR m.source_type = filter_source_type)
    ),
    keyword_matches AS (
        SELECT
            m.id,
            ts_rank_cd(m.search_vector, plainto_tsquery('english', query_text)) AS k_score
        FROM memories m
        WHERE m.user_id = filter_user_id
          AND m.is_active = TRUE
          AND m.deleted_at IS NULL
          AND (filter_source_type IS NULL OR m.source_type = filter_source_type)
    )
    SELECT
        m.id,
        m.user_id,
        m.source_type,
        m.source_id,
        m.content,
        m.summary,
        m.metadata,
        m.importance,
        m.confidence,
        coalesce(sm.s_score, 0.0)::FLOAT AS semantic_score,
        coalesce(km.k_score, 0.0)::FLOAT AS keyword_score,
        (
            (coalesce(sm.s_score, 0.0) * semantic_weight) +
            (coalesce(km.k_score, 0.0) * keyword_weight) +
            (m.importance * 0.1)
        )::FLOAT AS hybrid_score,
        m.created_at
    FROM memories m
    LEFT JOIN semantic_matches sm ON m.id = sm.id
    LEFT JOIN keyword_matches km ON m.id = km.id
    WHERE m.user_id = filter_user_id
      AND m.is_active = TRUE
      AND m.deleted_at IS NULL
      AND (filter_source_type IS NULL OR m.source_type = filter_source_type)
      AND (
          coalesce(sm.s_score, 0.0) >= match_threshold
          OR coalesce(km.k_score, 0.0) > 0.01
      )
    ORDER BY hybrid_score DESC
    LIMIT match_count;
END;
$$;
