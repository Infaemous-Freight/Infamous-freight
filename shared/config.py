from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    github_repository: str
    github_event_name: str
    github_event_path: Path | None
    github_sha: str
    github_ref_name: str
    github_api_url: str
    github_server_url: str
    openai_api_key: str
    openai_model: str
    openai_base_url: str | None
    enable_issue_labels: bool
    enable_draft_release: bool
    default_codeowners_team: str | None
    worker_max_pr_files: int
    worker_max_patch_chars: int

    @classmethod
    def from_env(cls) -> "Settings":
        event_path = os.getenv("GITHUB_EVENT_PATH")
        return cls(
            github_repository=os.getenv("GITHUB_REPOSITORY", ""),
            github_event_name=os.getenv("GITHUB_EVENT_NAME", ""),
            github_event_path=Path(event_path) if event_path else None,
            github_sha=os.getenv("GITHUB_SHA", ""),
            github_ref_name=os.getenv("GITHUB_REF_NAME", ""),
            github_api_url=os.getenv("GITHUB_API_URL", "https://api.github.com"),
            github_server_url=os.getenv("GITHUB_SERVER_URL", "https://github.com"),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            openai_base_url=os.getenv("OPENAI_BASE_URL"),
            enable_issue_labels=env_bool("ENABLE_ISSUE_LABELS", False),
            enable_draft_release=env_bool("ENABLE_DRAFT_RELEASE", False),
            default_codeowners_team=os.getenv("DEFAULT_CODEOWNERS_TEAM"),
            worker_max_pr_files=int(os.getenv("WORKER_MAX_PR_FILES", "60")),
            worker_max_patch_chars=int(os.getenv("WORKER_MAX_PATCH_CHARS", "6000")),
        )

    def require_github(self) -> None:
        if not self.github_repository:
            raise RuntimeError("GITHUB_REPOSITORY is required")
        if (
            not self.github_event_path
            or not self.github_event_path.exists()
            or not self.github_event_path.is_file()
            or not os.access(self.github_event_path, os.R_OK)
        ):
            raise RuntimeError("GITHUB_EVENT_PATH is missing or unreadable")

    def require_openai(self) -> None:
        if not self.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required")
