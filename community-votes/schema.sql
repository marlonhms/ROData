CREATE TABLE IF NOT EXISTS votes (
  patch_id TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (patch_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_votes_patch_value ON votes (patch_id, value);
