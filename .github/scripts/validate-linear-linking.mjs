#!/usr/bin/env node

const issueKeyRegex = /\bINF-\d+\b/i;

function hasIssueKey(value) {
  return issueKeyRegex.test(value || '');
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const prTitle = process.env.PR_TITLE || '';
const prBody = process.env.PR_BODY || '';
const commitMessages = process.env.COMMIT_MESSAGES || '';

if (!hasIssueKey(`${prTitle}\n${prBody}`)) {
  fail('PR must include a Linear issue key (e.g. INF-3) in title or body.');
}

if (!hasIssueKey(commitMessages)) {
  fail('At least one commit in this PR must reference a Linear issue key (e.g. INF-3).');
}

console.log('✅ Linear issue-linking checks passed.');
