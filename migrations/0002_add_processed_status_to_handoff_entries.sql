-- 0002_add_processed_status_to_handoff_entries.sql
ALTER TABLE handoff_entries ADD COLUMN is_processed_for_consolidation BOOLEAN DEFAULT FALSE;
