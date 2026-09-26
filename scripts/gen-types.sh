#!/usr/bin/env bash
# Regenerate lib/supabase/types.ts from the local database and restore the
# convenience aliases the application imports. Run after every migration.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp)"
npx supabase gen types typescript --local > "$tmp"
{
  echo "// Generated from the live schema with the Supabase types generator."
  echo "// Regenerate with scripts/gen-types.sh after every migration; never hand-edit."
  cat "$tmp"
  cat <<'TS'

// Convenience aliases the application imports. Regenerating the file above
// does not produce these, so scripts/gen-types.sh restores them.
export type TaskState = Enums<"task_state">;
export type TaskPriority = Enums<"task_priority">;
export type MemberRole = Enums<"member_role">;
TS
} > lib/supabase/types.ts
rm -f "$tmp"
echo "lib/supabase/types.ts regenerated"
