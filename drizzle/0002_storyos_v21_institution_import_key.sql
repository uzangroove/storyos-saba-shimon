CREATE UNIQUE INDEX IF NOT EXISTS institutions_legacy_source_id_unique
ON institutions (legacy_source_id)
WHERE legacy_source_id IS NOT NULL;
