from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import requests

from shared.config import Settings


class GitHubClient:
    def __init__(self, settings: Settings):
        settings.require_github()
        token = os.getenv("GITHUB_TOKEN", "")
        if not token:
            raise RuntimeError("GITHUB_TOKEN is required in GitHub Actions")

        self.settings = settings
        self.token = token
        self.base_url = settings.github_api_url.rstrip("/")
        self.repo = settings.github_repository
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "ai-repo-workers-starter",
            }
        )

    def load_event(self) -> dict[str, Any]:
        assert self.settings.github_event_path is not None
        return json.loads(Path(self.settings.github_event_path).read_text(encoding="utf-8"))

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        url = f"{self.base_url}{path}"
        response = self.session.request(method=method, url=url, timeout=60, **kwargs)
        if response.status_code >= 400:
            raise RuntimeError(f"GitHub API error {response.status_code} on {path}: {response.text}")
        if response.text.strip():
            return response.json()
        return None

    def paged_get(self, path: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        page = 1
        params = dict(params or {})
        per_page = int(params.pop("per_page", 100))
        while True:
            payload = self.request("GET", path, params={**params, "per_page": per_page, "page": page})
            if not isinstance(payload, list) or not payload:
                break
            items.extend(payload)
            if len(payload) < per_page:
                break
            page += 1
        return items

    def get_pull_request(self, number: int) -> dict[str, Any]:
        return self.request("GET", f"/repos/{self.repo}/pulls/{number}")

    def list_pull_request_files(self, number: int) -> list[dict[str, Any]]:
        return self.paged_get(f"/repos/{self.repo}/pulls/{number}/files")

    def get_check_runs(self, ref: str) -> list[dict[str, Any]]:
        data = self.request("GET", f"/repos/{self.repo}/commits/{ref}/check-runs")
        return data.get("check_runs", [])

    def list_issue_comments(self, issue_number: int) -> list[dict[str, Any]]:
        return self.paged_get(f"/repos/{self.repo}/issues/{issue_number}/comments")

    def create_issue_comment(self, issue_number: int, body: str) -> dict[str, Any]:
        return self.request(
            "POST",
            f"/repos/{self.repo}/issues/{issue_number}/comments",
            json={"body": body},
        )

    def update_issue_comment(self, comment_id: int, body: str) -> dict[str, Any]:
        return self.request(
            "PATCH",
            f"/repos/{self.repo}/issues/comments/{comment_id}",
            json={"body": body},
        )

    def upsert_issue_comment(self, issue_number: int, marker: str, body: str) -> None:
        comments = self.list_issue_comments(issue_number)
        existing = None
        for comment in comments:
            comment_body = comment.get("body", "")
            if marker in comment_body and comment.get("user", {}).get("type") == "Bot":
                existing = comment
                break

        payload = f"{marker}\n\n{body}"
        if existing:
            self.update_issue_comment(existing["id"], payload)
        else:
            self.create_issue_comment(issue_number, payload)

    def add_labels(self, issue_number: int, labels: list[str]) -> None:
        if not labels:
            return
        self.request(
            "POST",
            f"/repos/{self.repo}/issues/{issue_number}/labels",
            json={"labels": labels},
        )

    def search_issues(self, query: str, per_page: int = 10) -> list[dict[str, Any]]:
        data = self.request("GET", "/search/issues", params={"q": query, "per_page": per_page})
        return data.get("items", [])

    def list_tags(self, per_page: int = 20) -> list[dict[str, Any]]:
        return self.paged_get(f"/repos/{self.repo}/tags", params={"per_page": per_page})

    def compare(self, base: str, head: str) -> dict[str, Any]:
        return self.request("GET", f"/repos/{self.repo}/compare/{base}...{head}")

    def create_release(self, tag_name: str, body: str, target_commitish: str, draft: bool = True) -> dict[str, Any]:
        return self.request(
            "POST",
            f"/repos/{self.repo}/releases",
            json={
                "tag_name": tag_name,
                "target_commitish": target_commitish,
                "name": tag_name,
                "body": body,
                "draft": draft,
                "prerelease": False,
            },
        )
