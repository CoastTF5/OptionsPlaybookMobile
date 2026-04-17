CREATE TABLE IF NOT EXISTS mirror_snapshots (
  id             TEXT PRIMARY KEY DEFAULT 'latest',
  payload        JSONB NOT NULL,
  generated_at   TIMESTAMPTZ NOT NULL,
  ingested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mirror_snapshots_singleton CHECK (id = 'latest')
);
