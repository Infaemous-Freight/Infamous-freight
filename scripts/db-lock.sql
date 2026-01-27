CREATE TABLE IF NOT EXISTS deploy_locks (
  lock_name text PRIMARY KEY,
  locked_at timestamptz NOT NULL DEFAULT now()
);
