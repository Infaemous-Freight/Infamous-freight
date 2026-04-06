# CodeQL Configuration Issue and Resolution

## Problem

The repository currently has a conflict between two CodeQL setups:

1. **Advanced Configuration**: Custom CodeQL workflow at `.github/workflows/codeql.yml` with custom queries and configuration
2. **Default Setup**: GitHub's default CodeQL setup enabled in repository settings

GitHub does not allow both to coexist, resulting in this error:

```
Code Scanning could not process the submitted SARIF file:
CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled
```

## Root Cause

When GitHub's default CodeQL setup is enabled, GitHub will not process SARIF uploads produced by an advanced CodeQL workflow. Default Setup and Advanced Configuration are mutually exclusive, so enabling both causes the advanced workflow upload to fail. As a secondary detail, GitHub also reserves the `/language:` category prefix under Default Setup, but that is separate from the primary failure shown in the error above.

## Resolution Steps

A repository administrator must disable the default CodeQL setup:

### Option 1: Disable Default Setup (Recommended)

1. Go to the repository on GitHub
2. Navigate to **Settings** → **Code security and analysis**
3. Under **Code scanning**, find the default setup
4. Click **Disable** or switch to **Advanced** setup
5. The existing workflow in `.github/workflows/codeql.yml` will then work correctly

### Option 2: Remove Advanced Configuration

If you prefer to use the default setup instead:

1. Delete or move `.github/workflows/codeql.yml`
2. Delete `.github/codeql-config.yml` and `.github/codeql/codeql-config.yml`
3. Keep the default setup enabled

**Note**: This option loses the custom query configurations and path filters currently in place.

## Why Use Advanced Configuration?

This repository uses advanced configuration because it has:

- Custom query suites (`security-and-quality`)
- Specific path inclusions/exclusions
- Custom CodeQL configuration for JavaScript/TypeScript analysis
- Fine-grained control over what gets scanned

## Verification

Once default setup is disabled, the workflow should:

1. Complete successfully in GitHub Actions
2. Upload SARIF results without errors
3. Populate the Security tab with code scanning results

## Current Workflow Configuration

The workflow has been updated to:
- Reference the custom config file explicitly: `config-file: .github/codeql-config.yml`
- Remove the conflicting `category` parameter that was reserved for default setup
- Maintain all custom security scanning capabilities

## Contact

If you need assistance with this change, please contact the repository maintainer or your GitHub organization administrator.
