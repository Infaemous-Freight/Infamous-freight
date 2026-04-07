from pathlib import Path

import pytest

from shared.config import Settings
from workers.release.main import bump_version


def test_require_github_rejects_non_file_event_path(tmp_path):
    settings = Settings(
        github_repository='owner/repo',
        github_event_name='push',
        github_event_path=tmp_path,
        github_sha='abc123',
        github_ref_name='main',
        github_api_url='https://api.github.com',
        github_server_url='https://github.com',
        openai_api_key='key',
        openai_model='gpt-4o-mini',
        openai_base_url=None,
        enable_issue_labels=False,
        enable_draft_release=False,
        default_codeowners_team=None,
        worker_max_pr_files=60,
        worker_max_patch_chars=6000,
    )

    with pytest.raises(RuntimeError, match='GITHUB_EVENT_PATH is missing or unreadable'):
        settings.require_github()


def test_require_github_accepts_readable_event_file(tmp_path):
    event_path = tmp_path / 'event.json'
    event_path.write_text('{}')
    settings = Settings(
        github_repository='owner/repo',
        github_event_name='push',
        github_event_path=Path(event_path),
        github_sha='abc123',
        github_ref_name='main',
        github_api_url='https://api.github.com',
        github_server_url='https://github.com',
        openai_api_key='key',
        openai_model='gpt-4o-mini',
        openai_base_url=None,
        enable_issue_labels=False,
        enable_draft_release=False,
        default_codeowners_team=None,
        worker_max_pr_files=60,
        worker_max_patch_chars=6000,
    )

    settings.require_github()


def test_bump_version_rejects_non_numeric_semver_parts():
    assert bump_version('v1.two.3', 'patch') == 'v1.two.3-next'
