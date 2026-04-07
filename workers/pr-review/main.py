import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from shared.config import Settings
from shared.github_client import GitHubClient
from shared.llm import LLMClient
from shared.models import PRReviewResult
from shared.repo_tools import build_pr_context, classify_changed_files, format_bullets, summarize_check_runs
from shared.utils import append_step_summary, write_json

MARKER = '<!-- ai-workers:pr-review -->'

INSTRUCTIONS = '''You are the PR Reviewer worker for a software repository.
Return structured output only.

Goals:
- summarize the core change accurately
- rate the risk level
- identify likely breakpoints, regression risks, rollout risks, and missing validation
- separate blocking concerns from non-blocking concerns
- identify missing tests if visible from the diff
- suggest precise follow-up actions
'''


def render_comment(result):
    return f'''## PR Reviewer

**Risk level:** `{result.risk_level}`

**Summary**
{result.summary}

**Key changes**
{format_bullets(result.key_changes)}

**Blocking concerns**
{format_bullets(result.blocking_concerns)}

**Non-blocking concerns**
{format_bullets(result.non_blocking_concerns)}

**Missing tests**
{format_bullets(result.missing_tests)}

**Follow-ups**
{format_bullets(result.follow_ups)}
'''


def main():
    settings = Settings.from_env()
    gh = GitHubClient(settings)
    llm = LLMClient(settings)
    event = gh.load_event()
    pr_number = event.get('pull_request', {}).get('number')
    if pr_number is None:
        inputs = event.get('inputs')
        manual_pr = inputs.get('pr_number') if isinstance(inputs, dict) else None
        if isinstance(manual_pr, str) and manual_pr.strip().isdigit():
            pr_number = int(manual_pr.strip())
        elif isinstance(manual_pr, int):
            pr_number = manual_pr
        else:
            message = (
                'PR Reviewer skipped: no pull_request payload found. '
                'For manual workflow_dispatch runs, pass inputs.pr_number.'
            )
            append_step_summary(message)
            return

    pr = gh.get_pull_request(pr_number)
    files = gh.list_pull_request_files(pr_number)
    checks = gh.get_check_runs(pr['head']['sha'])
    file_counts = classify_changed_files(files)

    user_input = f'''Repository: {settings.github_repository}
PR number: {pr_number}
Title: {pr.get('title', '')}
Author: {pr.get('user', {}).get('login', '')}
Base branch: {pr.get('base', {}).get('ref', '')}
Head branch: {pr.get('head', {}).get('ref', '')}
PR body:
{(pr.get('body') or '')[:4000]}

Changed file counts:
{file_counts}

Checks:
{summarize_check_runs(checks)}

Diff context:
{build_pr_context(files, settings.worker_max_pr_files, settings.worker_max_patch_chars)}
'''

    result = llm.parse(PRReviewResult, INSTRUCTIONS, user_input)
    comment = render_comment(result)
    gh.upsert_issue_comment(pr_number, MARKER, comment)
    append_step_summary(comment)
    write_json(Path('artifacts') / f'pr-review-{pr_number}.json', result.model_dump())


if __name__ == '__main__':
    main()
