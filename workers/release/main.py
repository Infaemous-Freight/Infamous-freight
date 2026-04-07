import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from shared.config import Settings
from shared.github_client import GitHubClient
from shared.llm import LLMClient
from shared.models import ReleasePlanResult
from shared.repo_tools import classify_changed_files, format_bullets
from shared.utils import append_step_summary, write_json, write_text

INSTRUCTIONS = '''You are the Release Worker for a software repository.
Return structured output only.

Goals:
- recommend a semantic version bump
- produce a concise release headline
- separate highlights, fixes, breaking changes, and internal notes
'''


def bump_version(last_tag, bump):
    if not last_tag:
        return 'v0.1.0'
    clean = last_tag.lstrip('v')
    parts = clean.split('.')
    if len(parts) != 3 or any(not part.isdigit() for part in parts):
        return f'{last_tag}-next'
    major, minor, patch = map(int, parts)
    if bump == 'major':
        major += 1
        minor = 0
        patch = 0
    elif bump == 'minor':
        minor += 1
        patch = 0
    else:
        patch += 1
    return f'v{major}.{minor}.{patch}'


def render_release_notes(tag_name, result, base_ref):
    return f'''# {tag_name}

> Generated from changes since `{base_ref}`.

## Headline
{result.headline}

## Highlights
{format_bullets(result.highlights)}

## Fixes
{format_bullets(result.fixes)}

## Breaking changes
{format_bullets(result.breaking_changes)}

## Internal notes
{format_bullets(result.internal_notes)}
'''


def main():
    settings = Settings.from_env()
    gh = GitHubClient(settings)
    llm = LLMClient(settings)

    tags = gh.list_tags()
    last_tag = tags[0]['name'] if tags else None
    base_ref = last_tag or settings.github_sha
    comparison = gh.compare(base_ref, settings.github_sha) if last_tag else {'files': [], 'commits': []}
    files = comparison.get('files', [])
    commits = comparison.get('commits', [])
    file_counts = classify_changed_files(files)
    commit_summaries = []
    for item in commits[:40]:
        message = ((item.get('commit') or {}).get('message') or '').splitlines()
        first_line = message[0] if message else '<no commit message>'
        commit_summaries.append(f"- {item.get('sha', '')[:7]} {first_line}")

    user_input = f'''Repository: {settings.github_repository}
Last tag: {last_tag or 'none'}
Current SHA: {settings.github_sha}
Changed file counts: {file_counts}
Commit summaries:
{chr(10).join(commit_summaries) if commit_summaries else '- Initial release context or no compare range available.'}
'''

    result = llm.parse(ReleasePlanResult, INSTRUCTIONS, user_input)
    next_tag = bump_version(last_tag, result.version_bump)
    release_notes = render_release_notes(next_tag, result, base_ref)
    append_step_summary(release_notes)
    write_json(Path('artifacts') / f'release-plan-{next_tag}.json', result.model_dump())
    write_text(Path('artifacts') / f'release-notes-{next_tag}.md', release_notes)


if __name__ == '__main__':
    main()
