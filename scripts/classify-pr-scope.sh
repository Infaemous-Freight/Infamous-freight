#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/classify-pr-scope.sh [base_ref] [head_ref]

Classify changed files in a branch/PR into documentation, dependency, production,
and review-required buckets for safe PR splitting.

Examples:
  scripts/classify-pr-scope.sh origin/main HEAD
  scripts/classify-pr-scope.sh origin/main pr-2283-inspect

Outputs are written to .codex/pr-scope/.
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

base_ref="${1:-origin/main}"
head_ref="${2:-HEAD}"
output_dir=".codex/pr-scope"

if ! git rev-parse --verify "${base_ref}^{commit}" >/dev/null 2>&1; then
  echo "error: base ref '${base_ref}' is not available. Fetch it first, for example: git fetch origin main --prune" >&2
  exit 2
fi

if ! git rev-parse --verify "${head_ref}^{commit}" >/dev/null 2>&1; then
  echo "error: head ref '${head_ref}' is not available." >&2
  exit 2
fi

mkdir -p "${output_dir}"
all_changes="${output_dir}/all_changes.txt"
docs_changes="${output_dir}/docs_changes.txt"
dep_changes="${output_dir}/dependency_changes.txt"
prod_changes="${output_dir}/production_changes.txt"
review_changes="${output_dir}/review_required_changes.txt"
summary_file="${output_dir}/summary.md"

: > "${docs_changes}"
: > "${dep_changes}"
: > "${prod_changes}"
: > "${review_changes}"

git diff --name-only "${base_ref}...${head_ref}" | sort > "${all_changes}"

while IFS= read -r path; do
  [[ -z "${path}" ]] && continue

  case "${path}" in
    README.md|LICENSE|docs/*|*.md)
      printf '%s\n' "${path}" >> "${docs_changes}"
      ;;
    package.json|package-lock.json|pnpm-lock.yaml|yarn.lock)
      printf '%s\n' "${path}" >> "${dep_changes}"
      ;;
    apps/api/*|apps/web/*|services/*|prisma/*|infra/*|docker-compose.yml|Dockerfile|.github/workflows/*)
      printf '%s\n' "${path}" >> "${prod_changes}"
      ;;
    *)
      printf '%s\n' "${path}" >> "${review_changes}"
      ;;
  esac
done < "${all_changes}"

count_file() {
  local file="$1"
  if [[ -s "${file}" ]]; then
    wc -l < "${file}" | tr -d ' '
  else
    printf '0'
  fi
}

all_count="$(count_file "${all_changes}")"
docs_count="$(count_file "${docs_changes}")"
dep_count="$(count_file "${dep_changes}")"
prod_count="$(count_file "${prod_changes}")"
review_count="$(count_file "${review_changes}")"

cat > "${summary_file}" <<SUMMARY
# PR Scope Classification

Base: \`${base_ref}\`  
Head: \`${head_ref}\`

| Bucket | Count | Output |
| --- | ---: | --- |
| All changes | ${all_count} | \`${all_changes}\` |
| Documentation-safe candidates | ${docs_count} | \`${docs_changes}\` |
| Dependency-review candidates | ${dep_count} | \`${dep_changes}\` |
| Production/high-risk candidates | ${prod_count} | \`${prod_changes}\` |
| Review-required candidates | ${review_count} | \`${review_changes}\` |

## Merge Gate

A documentation-only recovery PR is merge-eligible only when:

- Documentation-safe candidates are the only changed files.
- Fewer than 10 files changed, unless a maintainer explicitly approves a larger documentation batch.
- No dependency, production, infrastructure, workflow, Prisma, API, or web app files changed.
- CI passes.
SUMMARY

cat "${summary_file}"

echo
if [[ "${prod_count}" != "0" || "${dep_count}" != "0" || "${review_count}" != "0" ]]; then
  echo "Scope check: REVIEW REQUIRED. Split non-documentation buckets before merging documentation."
else
  echo "Scope check: documentation-only candidate. Continue with normal CI validation."
fi
