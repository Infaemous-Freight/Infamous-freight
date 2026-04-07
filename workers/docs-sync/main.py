import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from shared.config import Settings
from shared.github_client import GitHubClient
from shared.llm import LLMClient
from shared.models import DocsSyncCheckResult
from shared.repo_tools import build_pr_context, classify_changed_files, detect_docs_needed, format_bullets
from shared.utils import append_step_summary, write_json, write_text

MARKER = '<!-- ai-workers:docs-sync -->'

INSTRUCTIONS = '''You are the Docs Sync Worker for a software repository.
Return structured output only.

Goals:
- determine whether docs updates are needed
- identify the docs surfaces that should change
- provide a concise changelog entry if one is warranted
- note migration or example updates when the change alters behavior, interfaces, or operator workflow
'''


def render_comment(result):
    return f'''## Docs Sync Worker

**Docs needed:** `{str(result.docs_needed).lower()}`

**Summary**
{result.summary}

**Reasons**
{format_bullets(result.reasons)}

**Suggested docs targets**
{format_bullets(result.suggested_docs)}

**Example updates**
{format_bullets(result.example_updates)}

**Migration notes**
{format_bullets(result.migration_notes)}

**Suggested changelog entry**
{result.changelog_entry or 'No changelog entry needed.'}
'''


def main():
    settings = Settings.from_env()
    gh = GitHubClient(settings)
    llm = LLMClient(settings)
    event = gh.load_event()

    if settings.github_event_name == 'pull_request':
        pr_number = event['pull_request']['number']
        pr = gh.get_pull_request(pr_number)
        files = gh.list_pull_request_files(pr_number)
        likely_needed = detect_docs_needed(files)
        file_counts = classify_changed_files(files)
        user_input = f'''Repository: {settings.github_repository}
Mode: pull_request_docs_check
Likely docs needed by heuristic: {likely_needed}
PR number: {pr_number}
Title: {pr.get('title', '')}
Changed file counts: {file_counts}

Diff context:
{build_pr_context(files, settings.worker_max_pr_files, settings.worker_max_patch_chars)}
'''
        result = llm.parse(DocsSyncCheckResult, INSTRUCTIONS, user_input)
        comment = render_comment(result)
        gh.upsert_issue_comment(pr_number, MARKER, comment)
        append_step_summary(comment)
        write_json(Path('artifacts') / f'docs-sync-pr-{pr_number}.json', result.model_dump())
        return

    if settings.github_event_name == 'push':
        before_sha = event.get('before', '')
        after_sha = event.get('after', settings.github_sha)
        comparison = gh.compare(before_sha, after_sha)
        files = comparison.get('files', [])
        commits = comparison.get('commits', [])
        file_counts = classify_changed_files(files)
        commit_summaries = []
        for item in commits[:30]:
            message = (item.get('commit', {}).get('message') or '').splitlines()
            first_line = message[0] if message else '<no commit message>'
            commit_summaries.append(f"- {item.get('sha', '')[:7]} {first_line}")
        user_input = f'''Repository: {settings.github_repository}
Mode: post_merge_docs_plan
Base SHA: {before_sha}
Head SHA: {after_sha}
Changed file counts: {file_counts}
Commit summaries:
{chr(10).join(commit_summaries) if commit_summaries else '- No commits in compare range.'}

Diff context:
{build_pr_context(files, settings.worker_max_pr_files, settings.worker_max_patch_chars)}
'''
        result = llm.parse(DocsSyncCheckResult, INSTRUCTIONS, user_input)
        markdown = render_comment(result)
        append_step_summary(markdown)
        write_json(Path('artifacts') / f'docs-sync-{after_sha[:7]}.json', result.model_dump())
        write_text(Path('artifacts') / f'docs-sync-{after_sha[:7]}.md', markdown)
        return

    raise RuntimeError(f'Unsupported event for docs sync: {settings.github_event_name}')


if __name__ == '__main__':
    main()
