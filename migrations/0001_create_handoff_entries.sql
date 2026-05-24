-- Migration: Create handoff_entries table
CREATE TABLE IF NOT EXISTS handoff_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT,
    source_chat TEXT,
    confidence_level TEXT,
    supersedes_previous BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
